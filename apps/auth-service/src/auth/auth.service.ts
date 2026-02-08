import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '../users/entities/user.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { LoginDto, RegisterDto, RefreshTokenDto, CreateUserAdminDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { EventPublisherService } from '../events/event-publisher.service';
import * as crypto from 'crypto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    lastLoginAt: Date | null;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity)
    private refreshTokenRepository: Repository<RefreshTokenEntity>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private eventPublisher: EventPublisherService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        'Account is locked. Please try again later.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      user.failedLoginAttempts += 1;

      // Lock account after 5 failed attempts for 15 minutes
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await this.userRepository.save(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed login attempts on successful login
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    const tokens = await this.generateTokens(user);

    // Publish audit log for successful login
    await this.eventPublisher.publishAuditLog({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'LOGIN',
      resource: 'auth',
      status: 'success',
    });

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<{ id: string; email: string }> {
    const { email, password, firstName, lastName, role } = registerDto;

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const saltRounds = this.configService.get('BCRYPT_ROUNDS', 12);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = this.userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role,
    });

    const savedUser = await this.userRepository.save(user);

    // Publish user.created event for other services to sync
    await this.eventPublisher.publishUserCreated({
      userId: savedUser.id,
      email: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      role: savedUser.role,
      phoneNumber: savedUser.phoneNumber || undefined,
      isActive: savedUser.isActive,
      mustChangePassword: savedUser.mustChangePassword,
      createdAt: savedUser.createdAt.toISOString(),
    });

    // Publish audit log
    await this.eventPublisher.publishAuditLog({
      userId: savedUser.id,
      userEmail: savedUser.email,
      action: 'REGISTER',
      resource: 'user',
      resourceId: savedUser.id,
      status: 'success',
    });

    this.logger.log(`User registered: ${savedUser.email} (${savedUser.id})`);

    return {
      id: savedUser.id,
      email: savedUser.email,
    };
  }

  async createUserAdmin(createUserDto: CreateUserAdminDto): Promise<{
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      phoneNumber: string | null;
      isActive: boolean;
      mustChangePassword: boolean;
      createdAt: Date;
    };
    temporaryPassword: string;
  }> {
    const { email, firstName, lastName, role, phoneNumber } = createUserDto;

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Generate a secure temporary password
    const temporaryPassword = this.generateTemporaryPassword();

    // Hash password
    const saltRounds = this.configService.get('BCRYPT_ROUNDS', 12);
    const passwordHash = await bcrypt.hash(temporaryPassword, saltRounds);

    const user = this.userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role: role as any,
      phoneNumber: phoneNumber || null,
      mustChangePassword: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Publish user.created event for other services to sync
    await this.eventPublisher.publishUserCreated({
      userId: savedUser.id,
      email: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      role: savedUser.role,
      phoneNumber: savedUser.phoneNumber || undefined,
      isActive: savedUser.isActive,
      mustChangePassword: savedUser.mustChangePassword,
      createdAt: savedUser.createdAt.toISOString(),
    });

    // Publish audit log for user creation
    await this.eventPublisher.publishAuditLog({
      action: 'CREATE',
      resource: 'user',
      resourceId: savedUser.id,
      status: 'success',
      newValues: {
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role,
      },
    });

    this.logger.log(`User created: ${savedUser.email} (${savedUser.id})`);

    return {
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role,
        phoneNumber: savedUser.phoneNumber,
        isActive: savedUser.isActive,
        mustChangePassword: savedUser.mustChangePassword,
        createdAt: savedUser.createdAt,
      },
      temporaryPassword,
    };
  }

  private generateTemporaryPassword(): string {
    // Generate a password like: Abc12345!
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%';

    let password = '';
    password += uppercase[crypto.randomInt(uppercase.length)];
    password += lowercase[crypto.randomInt(lowercase.length)];
    password += lowercase[crypto.randomInt(lowercase.length)];

    for (let i = 0; i < 5; i++) {
      password += numbers[crypto.randomInt(numbers.length)];
    }

    password += special[crypto.randomInt(special.length)];

    return password;
  }

  async findAllUsers(filters?: {
    search?: string;
    role?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      phoneNumber: string | null;
      isActive: boolean;
      mustChangePassword: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (filters?.search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.role) {
      queryBuilder.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: filters.isActive });
    }

    queryBuilder.orderBy('user.createdAt', 'DESC');

    const total = await queryBuilder.getCount();

    queryBuilder.skip((page - 1) * limit).take(limit);

    const users = await queryBuilder.getMany();

    return {
      data: users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async activateUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    user.isActive = true;
    await this.userRepository.save(user);

    // Publish user.activated event
    await this.eventPublisher.publishUserActivated({
      userId: user.id,
      email: user.email,
    });

    // Publish audit log
    await this.eventPublisher.publishAuditLog({
      action: 'UPDATE',
      resource: 'user',
      resourceId: user.id,
      status: 'success',
      oldValues: { isActive: false },
      newValues: { isActive: true },
    });

    this.logger.log(`User activated: ${user.email} (${user.id})`);
  }

  async deactivateUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    user.isActive = false;
    await this.userRepository.save(user);

    // Publish user.deactivated event
    await this.eventPublisher.publishUserDeactivated({
      userId: user.id,
      email: user.email,
    });

    // Publish audit log
    await this.eventPublisher.publishAuditLog({
      action: 'UPDATE',
      resource: 'user',
      resourceId: user.id,
      status: 'success',
      oldValues: { isActive: true },
      newValues: { isActive: false },
    });

    this.logger.log(`User deactivated: ${user.email} (${user.id})`);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthTokens> {
    const { refreshToken } = refreshTokenDto;

    let payload: { sub: string; jti: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET', 'your-refresh-secret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Find the refresh token in database
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { jti: payload.jti, userId: payload.sub },
      relations: ['user'],
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    if (storedToken.isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Revoke old refresh token (rotation)
    storedToken.isRevoked = true;
    await this.refreshTokenRepository.save(storedToken);

    // Generate new tokens
    return this.generateTokens(storedToken.user);
  }

  async logout(userId: string): Promise<void> {
    // Revoke all refresh tokens for the user
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );

    // Publish audit log for logout
    await this.eventPublisher.publishAuditLog({
      userId,
      action: 'LOGOUT',
      resource: 'auth',
      status: 'success',
    });
  }

  async getMe(userId: string): Promise<Omit<UserEntity, 'passwordHash'>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as Omit<UserEntity, 'passwordHash'>;
  }

  private async generateTokens(user: UserEntity): Promise<AuthTokens> {
    const jti = uuidv4();
    const refreshJti = uuidv4();

    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      jti,
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.get('JWT_SECRET', 'your-super-secret-jwt-key'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });

    const refreshPayload = {
      sub: user.id,
      jti: refreshJti,
    };

    const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get('JWT_REFRESH_SECRET', 'your-refresh-secret'),
      expiresIn: refreshExpiresIn,
    });

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshTokenEntity = this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: await bcrypt.hash(refreshToken, 10),
      jti: refreshJti,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }
}

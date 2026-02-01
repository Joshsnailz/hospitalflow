import { DataSource } from 'typeorm';
import { RoleEntity } from '../../roles/entities/role.entity';
import { ResourceEntity } from '../../resources/entities/resource.entity';
import { ActionEntity } from '../../actions/entities/action.entity';
import { PermissionEntity } from '../../permissions/entities/permission.entity';
import { RolePermissionEntity } from '../../permissions/entities/role-permission.entity';

export async function seedInitialData(dataSource: DataSource): Promise<void> {
  const roleRepository = dataSource.getRepository(RoleEntity);
  const resourceRepository = dataSource.getRepository(ResourceEntity);
  const actionRepository = dataSource.getRepository(ActionEntity);
  const permissionRepository = dataSource.getRepository(PermissionEntity);
  const rolePermissionRepository = dataSource.getRepository(RolePermissionEntity);

  console.log('Seeding initial RBAC data...');

  // 1. Seed Roles
  const rolesData = [
    { name: 'super_admin', displayName: 'Super Admin', description: 'Full system access', isSystem: true, hierarchyLevel: 100 },
    { name: 'clinical_admin', displayName: 'Clinical Admin', description: 'Clinical administration and user management', isSystem: true, hierarchyLevel: 90 },
    { name: 'consultant', displayName: 'Consultant', description: 'Senior medical consultant', isSystem: true, hierarchyLevel: 70 },
    { name: 'doctor', displayName: 'Doctor', description: 'Medical doctor/physician', isSystem: true, hierarchyLevel: 60 },
    { name: 'prescriber', displayName: 'Prescriber', description: 'Authorized prescriber', isSystem: true, hierarchyLevel: 50 },
    { name: 'hospital_pharmacist', displayName: 'Hospital Pharmacist', description: 'Hospital pharmacy staff', isSystem: true, hierarchyLevel: 40 },
    { name: 'pharmacy_support_manager', displayName: 'Pharmacy Support Manager', description: 'Pharmacy support team manager', isSystem: true, hierarchyLevel: 35 },
    { name: 'pharmacy_technician', displayName: 'Pharmacy Technician', description: 'Pharmacy technician', isSystem: true, hierarchyLevel: 30 },
    { name: 'pharmacy_support_worker', displayName: 'Pharmacy Support Worker', description: 'Pharmacy support staff', isSystem: true, hierarchyLevel: 20 },
  ];

  const roles: Record<string, RoleEntity> = {};
  for (const roleData of rolesData) {
    let role = await roleRepository.findOne({ where: { name: roleData.name } });
    if (!role) {
      role = roleRepository.create(roleData);
      role = await roleRepository.save(role);
      console.log(`  Created role: ${role.name}`);
    } else {
      console.log(`  Role exists: ${role.name}`);
    }
    roles[role.name] = role;
  }

  // 2. Seed Resources
  const resourcesData = [
    { name: 'user', displayName: 'User', description: 'User management' },
    { name: 'role', displayName: 'Role', description: 'Role management' },
    { name: 'permission', displayName: 'Permission', description: 'Permission management' },
    { name: 'patient', displayName: 'Patient', description: 'Patient records' },
    { name: 'appointment', displayName: 'Appointment', description: 'Appointment scheduling' },
    { name: 'prescription', displayName: 'Prescription', description: 'Prescriptions' },
    { name: 'medication', displayName: 'Medication', description: 'Medication records' },
    { name: 'discharge', displayName: 'Discharge', description: 'Discharge planning' },
    { name: 'audit', displayName: 'Audit', description: 'Audit logs' },
    { name: 'report', displayName: 'Report', description: 'Reports' },
  ];

  const resources: Record<string, ResourceEntity> = {};
  for (const resourceData of resourcesData) {
    let resource = await resourceRepository.findOne({ where: { name: resourceData.name } });
    if (!resource) {
      resource = resourceRepository.create(resourceData);
      resource = await resourceRepository.save(resource);
      console.log(`  Created resource: ${resource.name}`);
    } else {
      console.log(`  Resource exists: ${resource.name}`);
    }
    resources[resource.name] = resource;
  }

  // 3. Seed Actions
  const actionsData = [
    { name: 'create', displayName: 'Create', description: 'Create new records' },
    { name: 'read', displayName: 'Read', description: 'View records' },
    { name: 'update', displayName: 'Update', description: 'Modify existing records' },
    { name: 'delete', displayName: 'Delete', description: 'Remove records' },
    { name: 'approve', displayName: 'Approve', description: 'Approve requests' },
    { name: 'reject', displayName: 'Reject', description: 'Reject requests' },
    { name: 'export', displayName: 'Export', description: 'Export data' },
  ];

  const actions: Record<string, ActionEntity> = {};
  for (const actionData of actionsData) {
    let action = await actionRepository.findOne({ where: { name: actionData.name } });
    if (!action) {
      action = actionRepository.create(actionData);
      action = await actionRepository.save(action);
      console.log(`  Created action: ${action.name}`);
    } else {
      console.log(`  Action exists: ${action.name}`);
    }
    actions[action.name] = action;
  }

  // 4. Seed Permissions (resource:action:scope combinations)
  const permissionsData: Array<{ resource: string; action: string; scope: 'all' | 'own' | 'department' }> = [
    // User permissions
    { resource: 'user', action: 'create', scope: 'all' },
    { resource: 'user', action: 'read', scope: 'all' },
    { resource: 'user', action: 'read', scope: 'own' },
    { resource: 'user', action: 'update', scope: 'all' },
    { resource: 'user', action: 'update', scope: 'own' },
    { resource: 'user', action: 'delete', scope: 'all' },
    // Role permissions
    { resource: 'role', action: 'create', scope: 'all' },
    { resource: 'role', action: 'read', scope: 'all' },
    { resource: 'role', action: 'update', scope: 'all' },
    { resource: 'role', action: 'delete', scope: 'all' },
    // Permission permissions
    { resource: 'permission', action: 'create', scope: 'all' },
    { resource: 'permission', action: 'read', scope: 'all' },
    { resource: 'permission', action: 'update', scope: 'all' },
    // Patient permissions
    { resource: 'patient', action: 'create', scope: 'all' },
    { resource: 'patient', action: 'read', scope: 'all' },
    { resource: 'patient', action: 'read', scope: 'department' },
    { resource: 'patient', action: 'read', scope: 'own' },
    { resource: 'patient', action: 'update', scope: 'all' },
    { resource: 'patient', action: 'update', scope: 'own' },
    // Prescription permissions
    { resource: 'prescription', action: 'create', scope: 'all' },
    { resource: 'prescription', action: 'read', scope: 'all' },
    { resource: 'prescription', action: 'approve', scope: 'all' },
    // Audit permissions
    { resource: 'audit', action: 'read', scope: 'all' },
    { resource: 'audit', action: 'export', scope: 'all' },
  ];

  const permissions: Record<string, PermissionEntity> = {};
  for (const permData of permissionsData) {
    const resource = resources[permData.resource];
    const action = actions[permData.action];
    const name = `${permData.resource}:${permData.action}:${permData.scope}`;

    let permission = await permissionRepository.findOne({ where: { name } });
    if (!permission) {
      permission = permissionRepository.create({
        resourceId: resource.id,
        actionId: action.id,
        scope: permData.scope,
        name,
        displayName: `${resource.displayName} - ${action.displayName} (${permData.scope})`,
      });
      permission = await permissionRepository.save(permission);
      console.log(`  Created permission: ${permission.name}`);
    } else {
      console.log(`  Permission exists: ${permission.name}`);
    }
    permissions[name] = permission;
  }

  // 5. Assign permissions to roles
  const rolePermissionAssignments: Record<string, string[]> = {
    super_admin: Object.keys(permissions), // All permissions
    clinical_admin: [
      'user:create:all', 'user:read:all', 'user:update:all',
      'role:read:all',
      'permission:read:all',
      'patient:read:all', 'patient:update:all',
      'audit:read:all',
    ],
    consultant: [
      'user:read:own', 'user:update:own',
      'patient:read:all', 'patient:update:own',
      'prescription:create:all', 'prescription:read:all', 'prescription:approve:all',
    ],
    doctor: [
      'user:read:own', 'user:update:own',
      'patient:read:department', 'patient:update:own',
      'prescription:create:all', 'prescription:read:all',
    ],
    prescriber: [
      'user:read:own', 'user:update:own',
      'patient:read:own',
      'prescription:create:all', 'prescription:read:all',
    ],
    hospital_pharmacist: [
      'user:read:own', 'user:update:own',
      'patient:read:all',
      'prescription:read:all', 'prescription:approve:all',
    ],
    pharmacy_support_manager: [
      'user:read:own', 'user:update:own',
      'patient:read:department',
      'prescription:read:all',
    ],
    pharmacy_technician: [
      'user:read:own', 'user:update:own',
      'patient:read:own',
      'prescription:read:all',
    ],
    pharmacy_support_worker: [
      'user:read:own', 'user:update:own',
      'patient:read:own',
    ],
  };

  for (const [roleName, permissionNames] of Object.entries(rolePermissionAssignments)) {
    const role = roles[roleName];
    if (!role) continue;

    for (const permName of permissionNames) {
      const permission = permissions[permName];
      if (!permission) continue;

      const existing = await rolePermissionRepository.findOne({
        where: { roleId: role.id, permissionId: permission.id },
      });

      if (!existing) {
        const rp = rolePermissionRepository.create({
          roleId: role.id,
          permissionId: permission.id,
        });
        await rolePermissionRepository.save(rp);
        console.log(`  Assigned ${permName} to ${roleName}`);
      }
    }
  }

  console.log('Seeding complete!');
}

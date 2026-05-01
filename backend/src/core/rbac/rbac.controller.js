import { SystemOptionsService } from '../system/systemOptions.service.js';
import prisma from '../../config/db.js';
import { ROLE_PERMISSIONS } from './permissions.config.js';
import { assignRoleToUser, seedRolesForTenant } from './permissions.seed.js';

export class RBACController {
  /**
   * Create a new role
   */
  static async createRole(req, res) {
    try {
      const { name, description, permissions } = req.body;
      const tenantId = req.user?.tenantId;

      if (!name || !tenantId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Role name and tenant ID required' 
        });
      }

      const existingRole = await prisma.role.findFirst({
        where: { name, tenantId }
      });

      if (existingRole) {
        return res.status(400).json({ 
          success: false, 
          error: 'Role with this name already exists' 
        });
      }

      const role = await prisma.role.create({
        data: {
          name,
          tenantId
        }
      });

      if (permissions && Array.isArray(permissions) && permissions.length > 0) {
        const rolePermissions = permissions.map(permissionId => ({
          roleId: role.id,
          permissionId
        }));

        await prisma.rolePermission.createMany({
          data: rolePermissions,
          skipDuplicates: true
        });
      }

      const createdRole = await prisma.role.findUnique({
        where: { id: role.id },
        include: {
          permissions: {
            include: {
              permission: true
            }
          },
          _count: {
            select: { users: true }
          }
        }
      });

      res.status(201).json({ 
        success: true, 
        message: 'Role created successfully',
        data: createdRole
      });
    } catch (error) {
      console.error('Error creating role:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  /**
   * Update an existing role
   */
  static async updateRole(req, res) {
    try {
      const { id } = req.params;
      const { name, description, permissions } = req.body;
      const tenantId = req.user?.tenantId;

      if (!id || !tenantId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Role ID and tenant ID required' 
        });
      }

      const existingRole = await prisma.role.findFirst({
        where: { id, tenantId }
      });

      if (!existingRole) {
        return res.status(404).json({ 
          success: false, 
          error: 'Role not found' 
        });
      }

      if (['ADMIN', 'MANAGER', 'USER'].includes(existingRole.name)) {
        return res.status(403).json({ 
          success: false, 
          error: 'Cannot modify system roles' 
        });
      }

      if (name && name !== existingRole.name) {
        const nameExists = await prisma.role.findFirst({
          where: { 
            name, 
            tenantId,
            id: { not: id }
          }
        });

        if (nameExists) {
          return res.status(400).json({ 
            success: false, 
            error: 'Role with this name already exists' 
          });
        }

        await prisma.role.update({
          where: { id },
          data: { name }
        });
      }

      if (permissions && Array.isArray(permissions)) {
        await prisma.rolePermission.deleteMany({
          where: { roleId: id }
        });

        if (permissions.length > 0) {
          const rolePermissions = permissions.map(permissionId => ({
            roleId: id,
            permissionId
          }));

          await prisma.rolePermission.createMany({
            data: rolePermissions,
            skipDuplicates: true
          });
        }
      }

      const updatedRole = await prisma.role.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true
            }
          },
          _count: {
            select: { users: true }
          }
        }
      });

      res.json({ 
        success: true, 
        message: 'Role updated successfully',
        data: updatedRole
      });
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  /**
   * Delete a role
   */
  static async deleteRole(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!id || !tenantId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Role ID and tenant ID required' 
        });
      }

      const role = await prisma.role.findFirst({
        where: { id, tenantId },
        include: {
          _count: {
            select: { users: true }
          }
        }
      });

      if (!role) {
        return res.status(404).json({ 
          success: false, 
          error: 'Role not found' 
        });
      }

      if (['ADMIN', 'MANAGER', 'USER'].includes(role.name)) {
        return res.status(403).json({ 
          success: false, 
          error: 'Cannot delete system roles' 
        });
      }

      await prisma.rolePermission.deleteMany({
        where: { roleId: id }
      });

      await prisma.userRole.deleteMany({
        where: { roleId: id }
      });

      await prisma.role.delete({
        where: { id }
      });

      res.json({ 
        success: true, 
        message: 'Role deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  /**
   * Get all available roles
   */
  static async getRoles(req, res) {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Tenant ID required' 
        });
      }

      const roles = await prisma.role.findMany({
        where: { tenantId },
        include: {
          permissions: {
            include: {
              permission: true
            }
          },
          _count: {
            select: { users: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      // If no roles found, return empty array (system may not be initialized)
      if (!roles || roles.length === 0) {
        return res.json({ 
          success: true, 
          data: [],
          message: 'No roles found. Please run RBAC initialization.' 
        });
      }

      // Map to include permission details
      const rolesWithDetails = roles.map(role => ({
        id: role.id,
        name: role.name,
        label: ROLE_PERMISSIONS[role.name]?.label || role.name,
        description: ROLE_PERMISSIONS[role.name]?.description || '',
        permissionCount: role.permissions.length,
        userCount: role._count.users,
        permissions: role.permissions.map(rp => ({
          code: rp.permission.code,
          label: rp.permission.label
        }))
      }));

      res.json({ 
        success: true, 
        data: rolesWithDetails 
      });
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  /**
   * Get all available permissions
   */
  static async getPermissions(req, res) {
    try {
      const permissions = await prisma.permission.findMany({
        orderBy: { code: 'asc' }
      });

      // If no permissions found, return empty array
      if (!permissions || permissions.length === 0) {
        return res.json({ 
          success: true, 
          data: [],
          grouped: {},
          message: 'No permissions found. Please run RBAC initialization.' 
        });
      }

      // Group by module
      const grouped = {};
      permissions.forEach(perm => {
        const module = perm.code.split('.')[0];
        if (!grouped[module]) {
          grouped[module] = [];
        }
        grouped[module].push(perm);
      });

      res.json({ 
        success: true, 
        data: permissions,
        grouped 
      });
    } catch (error) {
      console.error('Error fetching permissions:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  /**
   * Get user's roles and permissions
   */
  static async getUserPermissions(req, res) {
    try {
      const userId = req.params.userId || req.user?.userId;
      const tenantId = req.user?.tenantId;

      if (!userId || !tenantId) {
        return res.status(400).json({ 
          success: false, 
          error: 'User ID and Tenant ID required' 
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true,
          email: true,
          role: true,
          status: true
        }
      });

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      });

      // Collect all unique permissions
      const permissionsSet = new Set();
      const roles = [];

      userRoles.forEach(ur => {
        // Filter by tenantId
        if (ur.role.tenantId === tenantId) {
          roles.push({
            id: ur.role.id,
            name: ur.role.name,
            label: ROLE_PERMISSIONS[ur.role.name]?.label || ur.role.name
          });
          ur.role.permissions.forEach(rp => {
            permissionsSet.add(rp.permission.code);
          });
        }
      });

      res.json({ 
        success: true, 
        data: {
          user: {
            ...user,
            legacyRole: user.role
          },
          roles,
          permissions: Array.from(permissionsSet),
          permissionCount: permissionsSet.size
        }
      });
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  /**
   * Assign role to user
   */
  static async assignRole(req, res) {
    try {
      const { userId, roleName } = req.body;
      const tenantId = req.user?.tenantId;

      if (!userId || !roleName || !tenantId) {
        return res.status(400).json({ 
          success: false, 
          error: 'User ID, role name, and tenant ID required' 
        });
      }

      // Verify role exists
      const role = await prisma.role.findFirst({
        where: { name: roleName, tenantId }
      });

      if (!role) {
        // Try to seed roles if they don't exist
        await seedRolesForTenant(tenantId);
        
        // Try again
        const retryRole = await prisma.role.findFirst({
          where: { name: roleName, tenantId }
        });
        
        if (!retryRole) {
          return res.status(404).json({ 
            success: false, 
            error: `Role ${roleName} not found` 
          });
        }
      }

      await assignRoleToUser(userId, roleName, tenantId);

      res.json({ 
        success: true, 
        message: `Role ${roleName} assigned successfully`,
        data: { userId, roleName }
      });
    } catch (error) {
      console.error('Error assigning role:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  /**
   * Remove role from user
   */
  static async removeRole(req, res) {
    try {
      const { userId, roleName } = req.body;
      const tenantId = req.user?.tenantId;

      if (!userId || !roleName || !tenantId) {
        return res.status(400).json({ 
          success: false, 
          error: 'User ID, role name, and tenant ID required' 
        });
      }

      const role = await prisma.role.findFirst({
        where: { name: roleName, tenantId }
      });

      if (!role) {
        return res.status(404).json({ 
          success: false, 
          error: `Role ${roleName} not found` 
        });
      }

      await prisma.userRole.delete({
        where: {
          userId_roleId: {
            userId: userId,
            roleId: role.id
          }
        }
      });

      res.json({ 
        success: true, 
        message: `Role ${roleName} removed successfully`,
        data: { userId, roleName }
      });
    } catch (error) {
      console.error('Error removing role:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  /**
   * Get all users with their roles
   */
  static async getUsersWithRoles(req, res) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Tenant ID required' 
        });
      }

      const users = await prisma.user.findMany({
        where: { tenantId },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          roles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  tenantId: true
                }
              }
            }
          },
          employee: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const usersWithRoles = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.employee?.name || user.email.split('@')[0],
        legacyRole: user.role,
        status: user.status,
        roles: user.roles
          .filter(ur => ur.role.tenantId === tenantId)
          .map(ur => ({
            id: ur.role.id,
            name: ur.role.name,
            label: ROLE_PERMISSIONS[ur.role.name]?.label || ur.role.name
          })),
        createdAt: user.createdAt
      }));

      res.json({ 
        success: true, 
        data: usersWithRoles 
      });
    } catch (error) {
      console.error('Error fetching users with roles:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  /**
   * Initialize roles for tenant (admin utility)
   */
  static async initializeRoles(req, res) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Tenant ID required' 
        });
      }

      await seedRolesForTenant(tenantId);

      res.json({ 
        success: true, 
        message: 'Roles initialized successfully' 
      });
    } catch (error) {
      console.error('Error initializing roles:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
}

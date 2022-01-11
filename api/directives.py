from ariadne import SchemaDirectiveVisitor
from graphql import default_field_resolver
from graphql.type import (
    GraphQLField,
    GraphQLObjectType,
)
from database import is_blank_slate, PermissionsMixin, User, Dataset, Record, Program

from typing import List, Iterable


class NotAuthorizedError(Exception):
    """Indicates user is not authorized to query the given field."""

    pass


class InvalidPermissionError(Exception):
    """Indicates a directive specified a permission that doesn't make sense."""

    pass


def user_has_permission(permissions: Iterable[str], obj, info) -> bool:
    """Test if a user has permission to access this resolver.

    :param permissions: List or set of permissions
    :param obj: GraphQL node this resolver is checking
    :param info: GraphQL context
    :returns: True if user has permission to access resolver
    """
    # If the permissions list is empty, user can access the field.
    if not permissions:
        return True

    # Implement specific permission checks here. Evaluate them in order from
    # cheapest to most expensive, and return True on the first check that
    # passes to avoid unnecessary checks.
    current_user = info.context.get("current_user")
    if "LOGGED_IN" in permissions:
        if current_user:
            return True

    if "BLANK_SLATE" in permissions:
        # Any user has this permission if the app has not been configured yet.
        if is_blank_slate(info.context["dbsession"]):
            return True

    # The rest of the permissions assume LOGGED_IN is true, since they
    # condition on the user object. So return False here if the user does not
    # exist to simplify the rest of the checks.
    if not current_user:
        return False

    if "ADMIN" in permissions:
        if any(role.name == "admin" for role in current_user.roles):
            return True

    if "PUBLISHER" in permissions:
        if any(role.name == "publisher" for role in current_user.roles):
            return True

    if "CURRENT_USER" in permissions:
        # This is only implemented for the User type.
        if not isinstance(obj, User):
            raise InvalidPermissionError(
                f"Can't enforce CURRENT_USER permission on type {type(obj)}"
            )
        if obj == current_user:
            return True

    if "TEAM_MEMBER" in permissions:
        # Track whether we were able to check permission at all (as opposed to
        # the directive being configured incorrectly / the right check not
        # being implemented yet).
        checked = False
        # This one's tricky because the exact procedure of the check depends on
        # what we're trying to resolve.
        if isinstance(obj, PermissionsMixin):
            if obj.user_is_team_member(current_user):
                return True
            checked = True

        # Check base mutations fields.
        # TODO(jnu): this pattern isn't really ideal since it references the
        # fields explicitly by name. If we want to use this permission on
        # more mutations we should abstract to make it more generic.
        if not obj:
            session = info.context["dbsession"]
            if info.field_name == "createRecord":
                checked = True
                id_ = info.variable_values["input"]["datasetId"]
                dataset = Dataset.get_not_deleted(session, id_)
                if dataset and dataset.user_is_team_member(current_user):
                    return True

            if info.field_name == "updateRecord":
                checked = True
                id_ = info.variable_values["input"]["id"]
                record = Record.get_not_deleted(session, id_)
                if record and record.user_is_team_member(current_user):
                    return True

            if info.field_name == "deleteRecord":
                checked = True
                id_ = info.variable_values["id"]
                record = Record.get_not_deleted(session, id_)
                if record and record.user_is_team_member(current_user):
                    return True

        if not checked:
            raise InvalidPermissionError(
                f"Can't enforce TEAM_MEMBER permission on type {type(obj)}, {info.field_name}"
            )

    return False


class NeedsPermissionDirective(SchemaDirectiveVisitor):
    """Enforce a permissions for an object or a field.

    This directive checks a set of permissions with ANY semantics. For example,
    with the directive:

    type Dataset @needsPermission(permission: [ADMIN, TEAM_MEMBER]) {
      ...
    }

    If the current user has either ADMIN or TEAM_MEMBER permissions, the
    request will succeed. If the user has neither permission, the request will
    return an error.

    The permissions can be refined per field. This will override any permission
    inherited from the object definition. For example:

    type Dataset @needsPermission(permission: [ADMIN, TEAM_MEMBER]) {
      id: ID!
      audit_log: [Audit!]! @needsPermission(permission: [ADMIN])
    }

    The `audit_log` field would require ADMIN permission. The TEAM_MEMBER
    permission would not be sufficient to see this field.
    """

    # Permissions argument name in schema directive
    PERM_ARG = "permission"

    # Custom attribute on Field definition where permissions are kept.
    PERM_KEY = "_permissions"

    # Custom attribute on field definition to mark that the field has already
    # been modified to check permissions.
    RESOLVED_KEY = "_resolved"

    def visit_object(self, object_type: GraphQLObjectType) -> GraphQLObjectType:
        """Update the object type definition with permissions.

        :param type_: GraphQL object type definition
        :returns: The updated type
        """
        permissions = self.args[self.PERM_ARG]

        # For all the fields in this type, add the object-level permissions if
        # the field does not define its own. If the field has permissions set
        # already, those will supercede the object-level perms.
        for name, field in object_type.fields.items():
            if not hasattr(field, self.PERM_KEY):
                setattr(field, self.PERM_KEY, permissions)
            self.resolve_field_with_permissions_check(field)

        return object_type

    def visit_field_definition(
        self, field: GraphQLField, object_type: GraphQLObjectType
    ) -> GraphQLField:
        """Update the field definition with permissions specified in directive.

        This is a GraphQL built-in hook.

        :param field: Field definition to update
        :param object_type: Parent object-type
        :returns: Modified field
        """
        # Set permissions, overriding anything previously set.
        setattr(field, self.PERM_KEY, self.args[self.PERM_ARG])
        self.resolve_field_with_permissions_check(field)
        return field

    def resolve_field_with_permissions_check(self, field: GraphQLField):
        """Update the resolver for the given field with a permissions check.

        :param field: Field definition to modify.
        """
        # Sometimes this field will be updated multiple times, if both the
        # OBJECT and FIELD_DEFINITION locations are used for a field. In this
        # case we need to avoid creating a doubly-wrapped resolver. So check
        # whether this field has been visited before.
        if getattr(field, self.RESOLVED_KEY, False):
            return
        setattr(field, self.RESOLVED_KEY, True)

        original_resolver = field.resolve or default_field_resolver

        def resolve_field_with_permissions(obj, info, **kwargs):
            permissions = set(getattr(field, self.PERM_KEY))
            if not user_has_permission(permissions, obj, info):
                raise NotAuthorizedError(
                    "Lacking permission: " + ", ".join(permissions)
                )
            return original_resolver(obj, info, **kwargs)

        field.resolve = resolve_field_with_permissions

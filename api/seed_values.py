"""Constants for records in the database.

The ORM records defined in this class are created when the app starts for
the very first time.

The records defined here use UUIDs. The IDs themselves are genuine, but they
are completely arbitrary. They are hardcoded here for consistency across tests
and app deployments. To add a new record, just generate a new UUID and enter
it into this file.

The classes in this file use the metaclass SeedValues so that we can ensure
all the values get properly instantiated in the database.
"""
from database import (
        Base,
        Role,
        Category,
        CategoryValue,
        )



_all_values = list[Base]()
"""List of all database values."""


class SeedValues(type):
    """Metaclass for records that tracks objects automatically."""

    def __new__(cls, name, bases, dict_):
        """Track all database object."""
        for v in dict_.values():
            if isinstance(v, Base):
                _all_values.append(v)
        return super().__new__(cls, name, bases, dict_)

    @staticmethod
    def merge_all(session):
        """Merge all seed objects into the given session."""
        for v in _all_values:
            session.merge(v)
            session.commit()



class Roles(metaclass=SeedValues):
    """Roles that can be assigned to users."""

    admin = Role(
            id="be5f8cac-ac65-4f75-8052-8d1b5d40dffe",
            name="admin",
            description="User is an admin and has administrative privileges",
            )

    publisher = Role(
            id="ee2de3ff-e147-453c-b49c-88122e112095",
            name="publisher",
            description="User can publish records",
            )


class Categories(metaclass=SeedValues):
    """Categories that are monitored by the app."""

    gender = Category(
            id="51349e29-290e-4398-a401-5bf7d04af75e",
            name="Gender",
            description=(
                "Gender: A social construct based on a group of emotional and "
                "psychological characteristics that classify an individual as "
                "feminine, masculine, androgynous or other. Gender can be "
                "understood to have several components, including gender identity, "
                "gender expression and gender role."
            ),
        )

    ethnicity = Category(
            id="2f98f223-417f-41ea-8fdb-35f0c5fe5b41",
            name="Ethnicity",
            description=(
                "Race & Ethnicity: Social constructs that categorize groups of "
                "people based on shared social and physical qualities. Definitions "
                "of race and ethnicity are not universally agreed upon and vary "
                "over time and place. Individuals may identify as belonging to "
                "multiple racial and ethnic groups."
            ),
        )

    disability = Category(
            id="55119215-71e9-43ca-b2c1-7e7fb8cec2fd",
            name="Disability",
            description=(
                "A disability is any condition of the body or mind (impairment) "
                "that makes it more difficult for the person with the condition "
                "to do certain activities (activity limitation) and interact with "
                "the world around them (participation restrictions). Some "
                "disabilities may be hidden or not easy to see."
            ),
        )


class Genders(metaclass=SeedValues):
    """Options for gender categories."""

    women = CategoryValue(
        id="742b5971-eeb6-4f7a-8275-6111f2342bb4",
        name="women",
        category=Categories.gender,
        tracks=[],
        entries=[],
        )

    men = CategoryValue(
        id="d237a422-5858-459c-bd01-a0abdc077e5b",
        name="men",
        category=Categories.gender,
        tracks=[],
        entries=[],
        )

    nonbinary = CategoryValue(
        id="6cae6d26-97e1-4e9c-b1ad-954b4110e83b",
        name="non-binary",
        category=Categories.gender,
        tracks=[],
        entries=[],
        )

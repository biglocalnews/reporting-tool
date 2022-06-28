"""Added sent_email table

Revision ID: 59bfd05b1044
Revises: f8ebe547d380
Create Date: 2022-04-04 17:17:46.952689

"""
from alembic import op
import sqlalchemy as sa
import fastapi_users

# revision identifiers, used by Alembic.
revision = "59bfd05b1044"
down_revision = "f8ebe547d380"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "sent_item",
        sa.Column("id", fastapi_users.db.sqlalchemy.GUID(), nullable=False),
        sa.Column("month_year", sa.String(length=255), nullable=False),
        sa.Column("sent_as", sa.String(length=255), nullable=False),
        sa.Column("to", sa.String(length=255), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("body_text", sa.String(), nullable=False),
        sa.Column("bcc", sa.String(), nullable=False),
        sa.Column("succeeded", sa.Boolean(), nullable=False),
        sa.Column("errors", sa.String(), nullable=True),
        sa.Column(
            "created", sa.TIMESTAMP(), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "updated", sa.TIMESTAMP(), server_default=sa.text("now()"), nullable=True
        ),
        sa.Column("deleted", sa.TIMESTAMP(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sent_item_id"), "sent_item", ["id"], unique=False)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f("ix_sent_item_id"), table_name="sent_item")
    op.drop_table("sent_item")
    # ### end Alembic commands ###

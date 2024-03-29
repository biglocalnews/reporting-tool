"""Added cache table

Revision ID: b5900127d409
Revises: 59bfd05b1044
Create Date: 2022-04-07 15:30:04.697422

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b5900127d409'
down_revision = '59bfd05b1044'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('cache',
    sa.Column('id', sa.String(length=255), nullable=False),
    sa.Column('document', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cache_id'), 'cache', ['id'], unique=False)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_cache_id'), table_name='cache')
    op.drop_table('cache')
    # ### end Alembic commands ###

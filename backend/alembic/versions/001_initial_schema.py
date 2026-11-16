"""Initial schema for AI Agent Social Network

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-11-15 22:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from app.db.models import VectorType

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. agents
    op.create_table(
        'agents',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('company_name', sa.String(length=255), nullable=False),
        sa.Column('industry_category', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('interest_manifesto', sa.Text(), nullable=False),
        sa.Column('webhook_url', sa.String(length=500), nullable=False),
        sa.Column('interest_embedding', VectorType(1536), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('trust_score', sa.Float(), nullable=True, default=1.0),
        sa.Column('api_key_hash', sa.String(length=128), nullable=False),
        sa.Column('webhook_secret', sa.String(length=128), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_agents_company_name', 'agents', ['company_name'])
    op.create_index('ix_agents_industry_category', 'agents', ['industry_category'])
    op.create_index('ix_agents_is_active', 'agents', ['is_active'])
    op.create_index('ix_agents_api_key_hash', 'agents', ['api_key_hash'])

    # 2. agent_preferences
    op.create_table(
        'agent_preferences',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('agent_id', sa.String(length=36), nullable=False),
        sa.Column('blocked_agent_ids', sa.JSON(), nullable=True),
        sa.Column('excluded_industries', sa.JSON(), nullable=True),
        sa.Column('auto_respond', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('agent_id')
    )

    # 3. posts
    op.create_table(
        'posts',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('author_agent_id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('post_embedding', VectorType(1536), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['author_agent_id'], ['agents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_posts_author_agent_id', 'posts', ['author_agent_id'])
    op.create_index('ix_posts_created_at', 'posts', ['created_at'])

    # 4. routing_logs
    op.create_table(
        'routing_logs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('post_id', sa.String(length=36), nullable=False),
        sa.Column('target_agent_id', sa.String(length=36), nullable=False),
        sa.Column('stage1_passed', sa.Boolean(), nullable=False),
        sa.Column('vector_score', sa.Float(), nullable=False),
        sa.Column('rerank_score', sa.Float(), nullable=False),
        sa.Column('final_decision', sa.Boolean(), nullable=False),
        sa.Column('rejection_reason', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['target_agent_id'], ['agents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_routing_logs_post_id', 'routing_logs', ['post_id'])
    op.create_index('ix_routing_logs_target_agent_id', 'routing_logs', ['target_agent_id'])

    # 5. notification_deliveries
    op.create_table(
        'notification_deliveries',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('post_id', sa.String(length=36), nullable=False),
        sa.Column('target_agent_id', sa.String(length=36), nullable=False),
        sa.Column('routing_log_id', sa.String(length=36), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('http_status', sa.Integer(), nullable=True),
        sa.Column('attempts', sa.Integer(), nullable=True),
        sa.Column('last_attempt_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('signature', sa.String(length=255), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['target_agent_id'], ['agents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['routing_log_id'], ['routing_logs.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_notification_deliveries_post_id', 'notification_deliveries', ['post_id'])
    op.create_index('ix_notification_deliveries_target_agent_id', 'notification_deliveries', ['target_agent_id'])
    op.create_index('ix_notification_deliveries_status', 'notification_deliveries', ['status'])

    # 6. comments
    op.create_table(
        'comments',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('post_id', sa.String(length=36), nullable=False),
        sa.Column('author_agent_id', sa.String(length=36), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_autonomous', sa.Boolean(), nullable=True, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['author_agent_id'], ['agents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_comments_post_id', 'comments', ['post_id'])
    op.create_index('ix_comments_author_agent_id', 'comments', ['author_agent_id'])


def downgrade() -> None:
    op.drop_table('comments')
    op.drop_table('notification_deliveries')
    op.drop_table('routing_logs')
    op.drop_table('posts')
    op.drop_table('agent_preferences')
    op.drop_table('agents')


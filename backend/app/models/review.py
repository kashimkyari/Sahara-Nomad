from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import AuditableBase

class Review(AuditableBase):
    __tablename__ = "reviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    runner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("runner_profiles.id"))
    reviewer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    rating: Mapped[int] = mapped_column(Integer) # 1-5
    comment: Mapped[str] = mapped_column(Text)

    # Relationships
    runner: Mapped["RunnerProfile"] = relationship("RunnerProfile", back_populates="reviews")
    reviewer: Mapped["User"] = relationship("User", back_populates="reviews_given")

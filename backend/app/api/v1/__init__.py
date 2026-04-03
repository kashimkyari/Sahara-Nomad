from fastapi import APIRouter
from .auth_router import router as auth_router
from .waka_router import router as waka_router
from .search_router import router as search_router
from .wallet_router import router as wallet_router
from .message_router import router as message_router
from .runner_router import router as runner_router
from .notification_router import router as notification_router
from .runner_application_router import router as runner_application_router
from .support_router import router as support_router
from .media_router import router as media_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(waka_router, prefix="/waka", tags=["waka"])
api_router.include_router(search_router, prefix="/search", tags=["search"])
api_router.include_router(wallet_router, prefix="/wallet", tags=["wallet"])
api_router.include_router(message_router, prefix="/chat", tags=["chat"])
api_router.include_router(runner_router, prefix="/runners", tags=["runners"])
api_router.include_router(notification_router, prefix="/notifications", tags=["notifications"])
api_router.include_router(runner_application_router, prefix="/runner-applications", tags=["runner-applications"])
api_router.include_router(support_router, prefix="/support", tags=["support"])
api_router.include_router(media_router, prefix="/media", tags=["media"])

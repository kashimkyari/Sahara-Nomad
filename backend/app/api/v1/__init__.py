from fastapi import APIRouter
from .auth_router import router as auth_router
from .waka_router import router as waka_router
from .search_router import router as search_router
from .wallet_router import router as wallet_router
from .message_router import router as message_router
from .runner_router import router as runner_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(waka_router, prefix="/waka", tags=["waka"])
api_router.include_router(search_router, prefix="/search", tags=["search"])
api_router.include_router(wallet_router, prefix="/wallet", tags=["wallet"])
api_router.include_router(message_router, prefix="/chat", tags=["chat"])
api_router.include_router(runner_router, prefix="/runners", tags=["runners"])

"""Залежності для захисту ендпоінтів. Використання в інших модулях:

    from app.modules.auth.dependencies import get_current_user, require_role

    @router.post("/", dependencies=[Depends(require_role("manager"))])
"""
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules.auth.models import User
from app.modules.auth.service import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)

_unauthorized = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise _unauthorized
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload["user_id"])
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError):
        raise _unauthorized
    user = db.get(User, user_id)
    if user is None:
        raise _unauthorized
    return user


def require_role(*roles: str):
    """Пропускає лише користувачів з однією з вказаних ролей, інакше 403."""
    allowed = {str(getattr(r, "value", r)) for r in roles}

    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user

    return checker

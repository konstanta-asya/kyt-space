"""Залежності для захисту ендпоінтів. Використання в інших модулях:

from app.modules.auth.dependencies import get_current_user, require_role

@router.post("/", dependencies=[Depends(require_role("manager"))])  # manager і вище
"""

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules.auth.models import Role, User, has_role
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
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError) as err:
        raise _unauthorized from err
    user = db.get(User, user_id)
    if user is None:
        raise _unauthorized
    return user


def require_role(minimum: str):
    """Пропускає користувачів з роллю `minimum` або вищою (див. ієрархію в Role), інакше 403."""
    minimum = Role(minimum)  # опечатка в ролі — ValueError одразу при старті, а не на запиті

    def checker(user: User = Depends(get_current_user)) -> User:
        if not has_role(user.role, minimum):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user

    return checker

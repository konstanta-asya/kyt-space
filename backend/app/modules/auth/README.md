# auth — Core Logic & Auth (Володимир)
Модель `users` (роль — рядок, ієрархія `client < kutivets < admin < manager < superadmin`), реєстрація, логін,
хешування паролів (bcrypt/argon2), JWT, перевірка прав за роллю.

Очікувані файли: models.py, schemas.py, service.py, router.py

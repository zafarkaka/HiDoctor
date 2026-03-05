from passlib.context import CryptContext
import bcrypt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

p_pass = "Admin123!"
hashed_pw = bcrypt.hashpw(p_pass.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
print("Hashed:", hashed_pw)

# Test verify
is_valid = pwd_context.verify(p_pass, hashed_pw)
print("Is valid passlib:", is_valid)

# Test verify with bcrypt directly
is_valid_bcrypt = bcrypt.checkpw(p_pass.encode('utf-8'), hashed_pw.encode('utf-8'))
print("Is valid bcrypt:", is_valid_bcrypt)

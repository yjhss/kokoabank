import { demoUser } from '../../mocks/bankData';
import { useAuthStore } from '../../stores/authStore';
import { useBankStore } from '../../stores/bankStore';

import type {
  LoginRequest,
  RegisterRequest,
} from '../../types/bank';

export function login(request: LoginRequest) {
  const { username, password } = request;

  if (
    username.trim() !== 'demo' ||
    password !== 'demo1234'
  ) {
    throw new Error(
      '데모 아이디와 비밀번호를 확인해주세요.',
    );
  }

  useBankStore.getState().reset();
  useAuthStore.getState().setUser(demoUser);

  return demoUser;
}

export function register(request: RegisterRequest) {
  const { username, password, name } = request;

  if (
    username.trim().length < 4 ||
    password.length < 8 ||
    !name.trim()
  ) {
    throw new Error('입력 정보를 확인해주세요.');
  }

  const user = {
    id: crypto.randomUUID(),
    username: username.trim(),
    name: name.trim(),
  };

  useBankStore.getState().reset();
  useAuthStore.getState().setUser(user);

  return user;
}

export function logout() {
  useAuthStore.getState().logout();
  useBankStore.getState().reset();
}

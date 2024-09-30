import { fetchData } from './functions';
import { UpdateResult } from './interfaces/UpdateResult';
import { UploadResult } from './interfaces/UploadResult';
import { LoginUser, UpdateUser, User } from './interfaces/User';
import { apiUrl, uploadUrl } from './variables';

// Select forms from the DOM
const loginForm = document.querySelector('#login-form') as HTMLFormElement | null;
const profileForm = document.querySelector('#profile-form') as HTMLFormElement | null;
const avatarForm = document.querySelector('#avatar-form') as HTMLFormElement | null;

// Select inputs from the DOM
const usernameInput = document.querySelector('#username') as HTMLInputElement;
const passwordInput = document.querySelector('#password') as HTMLInputElement;

const profileUsernameInput = document.querySelector('#profile-username') as HTMLInputElement;
const profileEmailInput = document.querySelector('#profile-email') as HTMLInputElement;

const avatarInput = document.querySelector('#avatar') as HTMLInputElement;

// Select profile elements from the DOM
const usernameTarget = document.querySelector('#username-target') as HTMLElement | null;
const emailTarget = document.querySelector('#email-target') as HTMLElement | null;
const avatarTarget = document.querySelector('#avatar-target') as HTMLImageElement | null;

// Function to log in the user
const login = async (): Promise<LoginUser> => {
  const username = usernameInput.value;
  const password = passwordInput.value;

  const response = await fetch(`${apiUrl}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error('Failed to log in');
  }

  const data: LoginUser = await response.json();
  localStorage.setItem('token', data.token); // Save token to local storage
  return data;
};

// Function to update user data
const updateUserData = async (
  user: UpdateUser,
  token: string
): Promise<UpdateResult> => {
  const response = await fetch(`${apiUrl}/user`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    throw new Error('Failed to update user data');
  }

  const result: UpdateResult = await response.json();
  return result;
};

// Function to add user data (email, username, and avatar) to the DOM
const addUserDataToDom = (user: User): void => {
  // Add user data to the DOM
  if (usernameTarget) {
    usernameTarget.textContent = user.username;
  }

  if (emailTarget) {
    emailTarget.textContent = user.email;
  }

  if (avatarTarget) {
    avatarTarget.src = user.avatar ? user.avatar : '/path-to-default-avatar-image.png';
  }

  // Populate form fields for editing profile
  if (profileUsernameInput) {
    profileUsernameInput.value = user.username;
  }

  if (profileEmailInput) {
    profileEmailInput.value = user.email;
  }
};

// Function to get user data using the token
const getUserData = async (token: string): Promise<User> => {
  const response = await fetch(`${apiUrl}/user`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }

  const user: User = await response.json();
  return user;
};

// Function to check local storage for token and update the DOM
const checkToken = async (): Promise<void> => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const user = await getUserData(token);
      addUserDataToDom(user);
    } catch (error) {
      console.error('Failed to fetch user data', error);
    }
  }
};

// Function to display error messages
const displayError = (message: string): void => {
  const errorTarget = document.querySelector('#error-message') as HTMLElement | null;
  if (errorTarget) {
    errorTarget.textContent = message;
    errorTarget.style.display = 'block';
  }
};

// Function to set loading state
const setLoadingState = (isLoading: boolean, form: HTMLFormElement) => {
  const button = form.querySelector('input[type="submit"]') as HTMLInputElement;
  if (button) {
    button.disabled = isLoading;
    button.value = isLoading ? 'Loading...' : 'Submit';
  }
};

// Event listener for login form
loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setLoadingState(true, loginForm);
  try {
    await login();
    const token = localStorage.getItem('token');
    if (token) {
      const user = await getUserData(token);
      addUserDataToDom(user);
    }
  } catch (error) {
    console.error('Login failed', error);
    displayError('Login failed. Please try again.');
  } finally {
    setLoadingState(false, loginForm);
  }
});

// Event listener for profile form (updating user data)
profileForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const token = localStorage.getItem('token');
  if (!token) return;

  const updatedUser: UpdateUser = {
    username: profileUsernameInput.value,
    email: profileEmailInput.value,
  };

  try {
    await updateUserData(updatedUser, token);
    await checkToken(); // Update DOM after successful update
  } catch (error) {
    console.error('Failed to update profile', error);
    displayError('Failed to update profile. Please try again.');
  }
});

// Function to upload avatar
const uploadAvatar = async (file: File, token: string): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch(`${uploadUrl}/avatar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload avatar');
  }

  const result: UploadResult = await response.json();
  return result;
};

// Event listener for avatar upload form
avatarForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const token = localStorage.getItem('token');
  if (!token) return;

  const file = avatarInput.files?.[0];
  if (!file) return;

  try {
    await uploadAvatar(file, token);
    await checkToken(); // Update DOM after successful upload
  } catch (error) {
    console.error('Failed to upload avatar', error);
    displayError('Failed to upload avatar. Please try again.');
  }
});

// Initial check for token and user data on page load
checkToken();

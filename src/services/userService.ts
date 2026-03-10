import api from './api';

export async function getUserInfo() {
    const { data } = await api.get('/user/me');
    return data;
}
/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
// type is eihter 'password' or 'data'

export const updateSettings = async (data, type) => {
    try {
        const url =
            type === 'password'
                ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword'
                : 'http://127.0.0.1:3000/api/v1/users/updateMe';
        const res = await axios({
            method: 'PATCH',
            url: url,
            data: data,
        });
        // console.log('Status', res);
        if (res.data.status === 'success') {
            showAlert('success', `${type.toUpperCase()} updated successfully!`);
        }
    } catch (err) {
        // console.log('error', err);
        showAlert('error', err.response.data.message);
    }
};

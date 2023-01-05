/* eslint-disable */

import { showAlert } from './alerts';
import axios from 'axios';
export const login = async (email, password) => {
    try {
        const res = await axios({
            method: 'POST',
            url: 'http://127.0.0.1:3000/api/v1/users/login',
            data: {
                email: email,
                password, //enhance object
            },
            // Hai cái email và password ở trên sẽ được xác thực rồi trả về jwt token như mình đã làm trong postman !
        });
        if (res.data.status === 'success') {
            showAlert('success', 'Logged in successfully');
            window.setTimeout(() => {
                location.assign('/');
            }, 500);
        }
        // có một vấn đề xảy ra là khi ta loggin thì nó k hiện thông báo và cũng không load lại trang, tức là mặc dù đã login nhưng ta vẫn ở trang login, nên ta làm như này để nó tự động load lại trang cho mình
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};

export const signup = async (name, email, password, passwordConfirm) => {
    try {
        const res = await axios({
            method: 'POST',
            url: 'http://127.0.0.1:3000/api/v1/users/signup',
            data: {
                name,
                email,
                password,
                passwordConfirm,
            },
        });
        if (res.data.status === 'success') {
            showAlert('success', 'Signed up successfully');
            window.setImmediate(() => {
                location.assign('/');
            }, 750);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};
export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: 'http://127.0.0.1:3000/api/v1/users/logout',
        });
        if ((res.data.status = 'success')) {
            location.assign('/login');
        }
    } catch (err) {
        showAlert('error', 'Error loggingout! Try again');
    }
};

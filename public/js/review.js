/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';

export const createReview = async (tourId, review, rating) => {
    try {
        const tour = tourId;
        const url = `http://127.0.0.1:3000/api/v1/tours/${tourId}/reviews`;
        const res = await axios({
            method: 'POST',
            url,
            data: {
                rating,
                review,
            },
        });
        console.log(res);
        if (res.data.status === 'success') {
            showAlert('success', `Review created Successfully`);
            window.setTimeout(() => {
                location.reload();
            }, 500);
        }
    } catch (err) {
        console.log(err);
        showAlert('error', err);
    }
};

/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
    const stripe = Stripe(
        'pk_test_51MMWJKALMLwYdibkJcgPhrVBL0KV3AOxTIRrd4EZbueRdVFSJVboOvrdntf4gSyBVrH1CNyxLq0xZUGMF9k2nalQ00qnePE1zM'
    );
    // 1) Get Checkout session from API
    try {
        const session = await axios(
            `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
        );
        console.log(session);

        await stripe.redirectToCheckout({
            sessionId: session.data.session.id,
        });
    } catch (err) {
        console.log(err);
        showAlert('error', err);
    }

    // 2) Create check out from + charge credit card
};

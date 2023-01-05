/*eslint-diable*/
import '@babel/polyfill'; //cái này dùng đọc dịch từ các  phiên bản mới về bản củ, nói chung là kiểu đồng nhất các phiên bản đấy
import { login, signup, logout } from './login';
import { displayMap } from './mapbox';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

import { createReview } from './review';
// Dom elements
const $ = document.querySelector.bind(document);
const mapBox = $('#map');
const loginForm = $('.form--login');
const logOutBtn = $('.nav__el--logout');
const signupForm = $('.form--signup');
const userDataForm = $('.form-user-data');
const userPasswordForm = $('.form-user-password');
const bookBtn = $('#book-tour');
const reviewBtn = $('.btn--review');
const reviewSave = $('.review-save');
const closeReview = $('.close');
// Delegation
if (mapBox) {
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
}

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Values
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = $('#name').value;
        const email = $('#email').value;
        const password = $('#password').value;
        const passwordConfirm = $('#passwordConfirm').value;
        signup(name, email, password, passwordConfirm);
    });
}
if (logOutBtn) {
    logOutBtn.addEventListener('click', logout);
}

if (userDataForm) {
    userDataForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Có một thứ khá hay là trước khi làm như này ta sử dụng chính cái tính chất default của việc submit để làm route nhưng khi ta build nó từ API của mình thì ta lại vứt bỏ cái dòng đó =)) và preventDefault lun..

        const form = new FormData();
        form.append('name', document.getElementById('name').value);
        form.append('email', document.getElementById('email').value);
        form.append('photo', document.getElementById('photo').files[0]);
        console.log(form);
        updateSettings(form, 'data');
    });
}
if (userPasswordForm) {
    userPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        $('.btn--save-password').textContent = 'Updating...';
        const currentPassword =
            document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm =
            document.getElementById('password-confirm').value;
        await updateSettings(
            { currentPassword, password, passwordConfirm },
            'password'
        );
        $('.btn--save-password').textContent = 'Saved new password...';
        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';
    });
}
if (bookBtn)
    bookBtn.addEventListener('click', (e) => {
        e.target.textContent = 'Processing...';
        const { tourId } = e.target.dataset;
        bookTour(tourId);
    });

if (reviewBtn) {
    reviewBtn.addEventListener('click', () => {
        document.querySelector('.bg-modal').style.display = 'flex';
    });
}

if (closeReview) {
    closeReview.addEventListener('click', () => {
        document.querySelector('.bg-modal').style.display = 'none';
    });
}
if (reviewSave) {
    reviewSave.addEventListener('click', (e) => {
        const review = document.getElementById('review').value;
        const rating = document.getElementById('ratings').value;
        const { tourId } = e.target.dataset;
        createReview(tourId, review, rating);
        document.querySelector('.bg-modal').style.display = 'none';
    });
}

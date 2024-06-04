/* tslint:disable */
/* eslint-disable */
/**
* @param {number} a
* @returns {number}
*/
export function times_two(a: number): number;
/**
* @param {string} _keye
* @param {string} _ive
* @param {string} _pte
* @returns {string}
*/
export function encrypt(_keye: string, _ive: string, _pte: string): string;
/**
* @param {string} _keyd
* @param {string} _ivd
* @param {string} _ctd_
* @returns {string}
*/
export function decrypt(_keyd: string, _ivd: string, _ctd_: string): string;
/**
* @param {string} input
* @returns {string}
*/
export function count_characters(input: string): string;
/**
* @param {number} password_length
* @param {boolean} add_special_char
* @param {boolean} add_number
* @param {boolean} capitalize_first_letter
* @returns {string}
*/
export function generate_password(password_length: number, add_special_char: boolean, add_number: boolean, capitalize_first_letter: boolean): string;
/**
* @param {string} password
* @returns {string}
*/
export function guessable(password: string): string;
/**
* @param {string} password
* @returns {string}
*/
export function calculate_password_strength(password: string): string;
/**
* @param {string} password
* @returns {string}
*/
export function calculate_password_strength2(password: string): string;

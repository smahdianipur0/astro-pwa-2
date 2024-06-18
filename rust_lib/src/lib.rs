
use wasm_bindgen::prelude::wasm_bindgen;

use std::str;
use base64::prelude::*;
use aes::Aes128;
use ofb::Ofb;
use ofb::cipher::{KeyIvInit, StreamCipher};

use random_word::{all_len, Lang};
use rand::Rng;
use rand::seq::IndexedRandom;
use rand::prelude::SliceRandom;

extern crate zxcvbn;
use zxcvbn::zxcvbn;




type AesOfb = Ofb<Aes128>;


#[wasm_bindgen]
pub fn times_two(a: i32) -> i32 {
    let z = a*2;
    z
}

#[wasm_bindgen]
pub fn encrypt(_keye: &str, _ive: &str, _pte: &str) -> String {
    
    if _keye.trim().chars ().count () != 16 { 
        let _encrypted_output:String  = "Key is not 16 Characters".to_string();
        return _encrypted_output;
    }
    if _ive.trim().chars ().count () != 16 {
            let _encrypted_output: String = "IV is not 16 Characters".to_string();
            return _encrypted_output;
        }
    let keye:Vec<u8>   = _keye.trim().as_bytes().to_vec();
    let ive:Vec<u8>  = _ive.trim().as_bytes().to_vec();
    let mut pte:Vec<u8>  = _pte.trim().as_bytes().to_vec();
    let mut cipher = AesOfb::new_from_slices(&keye, &ive).unwrap();
    cipher.apply_keystream( &mut pte);
    let _encrypted_output = BASE64_STANDARD.encode(pte);
    _encrypted_output
}



#[wasm_bindgen]
pub fn decrypt(_keyd: &str, _ivd: &str, _ctd_: &str) -> String {

    if _keyd.trim().chars ().count () != 16 { 
        let _decrypted_output:String  = "Key is not 16 Characters".to_string();
        return _decrypted_output;
    }
    if _ivd.trim().chars ().count () != 16 {
            let _decrypted_output: String = "IV is not 16 Characters".to_string();
            return _decrypted_output;
        }
    let keyd:Vec<u8>  = _keyd.trim().as_bytes().to_vec();
    let ivd:Vec<u8>  = _ivd.trim().as_bytes().to_vec();
    let ctd:&str  = _ctd_.trim();
    let mut _ctd = match BASE64_STANDARD.decode(ctd) {
        Ok(v) => v, 
        Err(_e) => return format!("Invalid Credentials"), };
    let mut cipher =  AesOfb::new_from_slices(&keyd, &ivd).unwrap();
    cipher.apply_keystream(  &mut _ctd);
    let _decrypted_output = match str::from_utf8(&_ctd) {
        Ok(s) => s.to_string(), 
        Err(_e) => return format!("Invalid Credentials"), };
    _decrypted_output
}


#[wasm_bindgen]
pub fn count_characters(input: &str) -> String {
    let num_chars = input.trim().chars().count();
    if num_chars == 16 {
        return format!("✔️");
    } else {
        return format!("{} / 16", num_chars);
    }
}



#[wasm_bindgen]
pub fn generate_password(password_length: usize, add_special_char: bool, add_number: bool,
 capitalize_first_letter: bool) -> String {
    let special_chars = vec!['!', '@', '#', '$', '%', '&', '*', '(', ')', '-', '+'];
    let mut rng = rand::thread_rng();
    let mut password = String::new();

   
   let structures = vec![
        (12, vec![vec![4, 8],vec![6, 6],vec![5, 7] ,vec![7, 5] ]),
        (13, vec![vec![5, 8],vec![7, 6], vec![7, 6], vec![8, 5] ]),
        (14, vec![vec![6, 8], vec![7, 7] , vec![8, 6]
           , vec![3, 3, 8] ]),
        (15, vec![vec![7, 8] ,vec![8, 7]
           , vec![3, 4, 8], vec![3, 5, 7], vec![4, 3, 8] ,vec![4, 4, 7] ,vec![5, 3, 7] ]),
        (16, vec![vec![8, 8]
           , vec![3, 5, 8], vec![3, 6, 7],  vec![4, 4, 8] ,vec![4, 5, 7], vec![5, 3, 8] 
           , vec![5, 4, 7], vec![6, 3, 7] ]),
        (17, vec![vec![3, 6, 8]  ,vec![3, 7, 7] ,vec![4, 5, 8] ,vec![4, 6, 7],vec![5, 4, 8] 
           , vec![5, 5, 7], vec![6, 3, 8] ,vec![6, 4, 7] ,vec![7, 3, 7] ]),
        (18, vec![vec![3, 7, 8] ,vec![3, 8, 7]  ,vec![4, 6, 8] ,vec![4, 7, 7]
           , vec![5, 5, 8] ,vec![5, 6, 7]  ,vec![6, 4, 8] ,vec![6, 5, 7]
           , vec![7, 3, 8] ,vec![7, 4, 7]  ,vec![8, 3, 7] ]),
        (19, vec![vec![4, 7, 8] ,vec![4, 8, 7]  ,vec![5, 6, 8] ,vec![5, 7, 7]
           , vec![6, 5, 8] ,vec![6, 6, 7]  ,vec![7, 4, 8] ,vec![7, 5, 7]
           , vec![8, 3, 8] ,vec![8, 4, 7] ]),
        (20, vec![vec![4, 8, 8] ,vec![5, 7, 8]  ,vec![5, 8, 7] ,vec![6, 6, 8]
           , vec![6, 7, 7] ,vec![7, 5, 8]  ,vec![7, 6, 7] ,vec![8, 4, 8] ,vec![8, 5, 7] ]),
    ];


    let additional_chars_per_word = (add_special_char as usize) + (add_number as usize);


    if let Some((_, combinations)) = structures.iter().find(|&&(len, _)| len == password_length) {
        if let Some(word_lengths) = combinations.choose(&mut rng) {
            let total_additional_chars = additional_chars_per_word * word_lengths.len();
            let available_chars_for_words = password_length - total_additional_chars;
            

            let mut adjusted_word_lengths = word_lengths.clone();
                let mut remaining_chars = available_chars_for_words;

  
                let mut chars_to_subtract = 0;
                if add_special_char && add_number {
                    // Subtract 2 characters for 2-word passwords, 4 for 3-word passwords
                    chars_to_subtract = if word_lengths.len() == 2 { 2 } else { 4 };
                } else if add_special_char || add_number {
                    // Subtract 1 character for 2-word passwords, 2 for 3-word passwords
                    chars_to_subtract = if word_lengths.len() == 2 { 1 } else { 2 };
                }

                // Calculate the length of the slice to iterate over
                let slice_length = adjusted_word_lengths.len() - 1;

                // Distribute the available characters across the words, except for the last word
                for word_length in &mut adjusted_word_lengths[..slice_length] {
                    if *word_length > remaining_chars {
                        *word_length = remaining_chars;
                    }
                    remaining_chars = remaining_chars.saturating_sub(*word_length);
                }

    if chars_to_subtract > 0 {
        let last_word_length = adjusted_word_lengths.last_mut().unwrap();
        *last_word_length = last_word_length.saturating_sub(chars_to_subtract);
    }


                for (index, &length) in adjusted_word_lengths.iter().enumerate() {
                if let Some(word_list) = all_len(length, Lang::En) {
                    let mut word = word_list[rng.gen_range(0..word_list.len())].to_string();
                    // Capitalize the first letter if enabled
                    if capitalize_first_letter {
                        word = word.chars().next().unwrap().to_uppercase().to_string() + &word[1..];
                    }
                    // password.push_str(&word);

                    let mut chars_to_add = Vec::new();

                    // Add a special character if enabled
                    if add_special_char && index != adjusted_word_lengths.len() - 1 {
                        let special_char = special_chars[rng.gen_range(0..special_chars.len())];
                        chars_to_add.push(special_char);
                    }

                    // Add a number if enabled
                    if add_number && index != adjusted_word_lengths.len() - 1 {
                        let number = rng.gen_range(0..10).to_string();
                        chars_to_add.push(number.chars().next().unwrap());
                    }

                    // Shuffle the characters to add them in random order
                    chars_to_add.shuffle(&mut rng);

                    // Append the shuffled characters to the word
                    for c in chars_to_add {
                        word.push(c);
                    }

                    // Append the word to the password
                    password.push_str(&word);

                    
                }
            }
        }
    }

    password
}

#[wasm_bindgen]
pub fn guessable(password: &str) -> String {

if password.trim().chars ().count () == 0 { 
         let errmsg:String  = "Enter password".to_string();
         return errmsg;
    }
    let estimate = zxcvbn(&password, &[]).unwrap();
    let score = estimate.score();

    match score {
        e if e == 0 => "Too Guessable".to_string(),
        e if e == 1 => "Very Guessable".to_string(),
        e if e == 2 => "Somewhat Guessable".to_string(),
        e if e == 3 => "Safely Unguessable".to_string(), 
        _  => "Very Unguessable".to_string(), 
    }

}

#[wasm_bindgen]
pub fn calculate_password_strength(password: &str) -> String {
    match zxcvbn::zxcvbn(password, &[]) {
        Ok(entropy) => {
            // Return the formatted string for offline slow hashing crack time
            format!(
                 "Slow Hashing: {}",
                entropy.crack_times().offline_slow_hashing_1e4_per_second(),
                
            )
        },
        Err(e) => {
            // Return the error as a string
            e.to_string()
        }
    }
}

#[wasm_bindgen]
pub fn calculate_password_strength2(password: &str) -> String {
    match zxcvbn::zxcvbn(password, &[]) {
        Ok(entropy) => {
            // Return the formatted string for offline slow hashing crack time
            format!(
                 "Fast Hashing: {}",
                
                entropy.crack_times().offline_fast_hashing_1e10_per_second()
            )
        },
        Err(e) => {
            // Return the error as a string
            e.to_string()
        }
    }
}

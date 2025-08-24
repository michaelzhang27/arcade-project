# Project Description

This project is structured into a frontend and backend, where the backend is a Flask API application that implements a Key Value Store system, with state persistence via a Supabase Postgres storage implementation.

To provide a little more context into the vision of this project, I wanted to find a way to apply the key value store system into a usable simplified Arcade application. Thus, I used a stable diffusion API to create a Custom Product Generator where users can create images of products with natural language. Some additional features of this project include ability to iterate on previously created images, add to cart, purchase items and view purchase history.

## Getting Started

- Please clone this repository, or download as zip:

```bash
git clone https://github.com/michaelzhang27/arcade-project.git
```

- Next, to run the frontend Next.JS application, please navigate to the root directory of the project and run:

```bash
npm install
```

- Followed by:

```bash
npm run dev
```

- To run the backend, please run:

```bash
cd backend
pip install -r requirements.txt
# then
gunicorn -b 0.0.0.0:4000 app:app
```

You can now open the application on `localhost:3000` and can begin playing around with the project. Please note that due to free API limits for the stable diffusion model, you will only have 8 image generations available before the free quota is reached, should you want more generations, I have instructions later on generating your own API key to access 10 new generations.

## Backend Overview

The Flask API is hosted in `app.py` and runs on PORT 4000.

I list my API keys to the Stability API, the stable diffusion provider, as well as my Supabase database. I understand that in real production environments, you should NEVER publicly list your API keys, however, for ease of use and lack of important information related to these links, I have listed them in the file for you to see.

Should you want 10 more generations, please navigate to: <https://platform.stability.ai/docs/api-reference> and create an account. After account creation, please navigate to your account page: <https://platform.stability.ai/account/keys> and copy and paste your keys into `STABILITY_API_KEY`. You should now have 10 more generations.

Below the app initialization, I then have the `Store` class, which maps creations IDs, the keys, to the array of prompts used to create the creation as well as the base64 encoded image of the creation, which together make up the values.

In the `Store` class, I keep track of a temporary store dictionary, `cart`, which when committed, uploads to Supabase and is transitioned into the `committed_store` dictionary.

The stores are structured as following:

```json
{
  "creationID": {
    "prompts": ["prompt1", "follow up on prompt1..."],
    "image": "base64-encoded-image"
  }
}
```

In the `Store` class, I then define the functions specified in the project outline, whilst adding `snapshot`, which just returns the creations currently in the cart.

Beneath the class initialization, I initialize a store object and then I have my API endpoints, which call upon the functions defined in the `Store` class.

### API notes

- Although GET requests typically use query parameters, this implementation accepts a JSON request body containing `creation_id` for `/store/get`. This avoids URL length limits and encoding issues when working with long values like the base64 encoded image string

#### API Table

| Endpoint        | Method | Request Body (JSON)                                                                   | Response (JSON)                                                                                   |
| --------------- | ------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| /generate       | POST   | { "prompt": string, "image"?: string (base64) }                                       | { "ok": true, "image": string (base64) } or { "ok": false, "error": string }                      |
| /store/set      | POST   | { "creation_id": string, "value": { "prompts": string[], "image": string (base64) } } | { "ok": true }                                                                                    |
| /store/get      | GET    | { "creation_id": string } (JSON body)                                                 | { "ok": true, "value": { "prompts": string[], "image": string (base64) } }                        |
| /store/delete   | POST   | { "creation_id": string }                                                             | { "ok": true }                                                                                    |
| /store/cart     | GET    | —                                                                                     | { "ok": true, "items": { "creation_id": { "prompts": string[], "image": string (base64) } } }     |
| /store/commit   | POST   | —                                                                                     | { "ok": true, "committed": { "creation_id": { "prompts": string[], "image": string (base64) } } } |
| /store/rollback | POST   | —                                                                                     | { "ok": true }                                                                                    |
| /history        | GET    | —                                                                                     | { "ok": true, "history": { "creation_id": { "prompts": string[], "image": string (base64) } } }   |

## Run Time

As indexing into a dictionary by key is constant time, my set, get, and delete operations are O(1) constant time. Initializing the Store is O(n) where n is the number of elements inside of the committed store, but can be cut to constant time if I elect to use Remote Procedure Calls and move the class logic to the database server, eliminating the need to retrieve the committed store on app initialization. The snapshot and rollback functions are O(1) constant time, and the commit function is O(m) where m is the number of elements in the cart.

## Testing

While the bulk of this project is an application of a Key Value Store system, I also have `tests.py` which tests the functionality of the Key Value Store system itself. I tested 3 different scenarios and cases in which the Store system would be used, and asserted at each step that the results we get from the Store implementation match what we would expect. I have also done extensive manual testing on the system via the frontend application.

Run the tests:

```bash
cd backend
python3 tests.py
```

---

Thank you for your time and hope you enjoyed looking through my project!

*This project has been created as part of the 42 curriculum by axlleres, lucmansa, guviure*

# Description
This project is call Transcendence, and it consist to an online connect four,
you can play connect four within IA or other player, you can have friends, you can get achievements for skin

# Instruction

### Prerequist

You need **docker** and **openssl** to launch the project

### Certificates
you will need to create the ssl certificates in the frontend

create the `secrets` folder in`src/frontend` and execute the following command inside it to create self signed certificates, you can use your own if you have ones

```
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout server.key -out server.crt -subj "/CN=localhost"
```

### .env
you will need to create a .env file in the `src/` folder

a exemple .env `exemple.env` is available 



# Resources

### Frontend

react official documentation.

AI was use for exemple or function explanation. It was also use for listing css variable

### Backend

python doc

# Team information

### axlleres
Team leader, backend manager

### lucmansa
frontend manager, react and styling imprementation

### guviure
AI algorithm creation and implementation, bug-testing and fixer

# Project management
We meet 4–5 times a week to work togetheer,implement feature across fontend and backend,backend and IA algorythm

Github whas use to store the project online, Git was used to separate the project's progress into branches

For distance communitication we use Discord with a private group


# Technical Stack

### Frontend
frontend use react for frontend, styling is pure css
React was chosen for its ease of use; there are many tutorials and resources available.

### Backend
backend use django
for it simplicity and efficacity

### Database
Database is mariadb
MariaDB was chosen for its simplicity and robustness, which have been proven over time.

# Database shema

### User
Internal Django table
- id `unique Integer`
- email `string`
- password `hashed string`

### Profile
- user `User foreign key`
- bio `1000 character string`
- country `2 character string`
- join\_date `date iso format`
- email\_confirmed `boolean`

### Game
Created when a game is finished, winner set to 0 meaning a tie
- user1 `User foreign key`
- user2 `User foreign key`
- winner `Integer choice between 0, 1 or 2`
- date `date iso format`

### Stats
Stats earned while playing \
`number_placed` represents who many times the user has placed a token \
`used_skin` refer to the skin id \
`achievement` represents earned achievement as 1s in a string \
streak can be negative if the user has lost multiple time a row or positive if won multiple in a row \
elo starts at 100 on user creation
- user `User foreign key`
- number\_win `Integer`
- number\_loss `Integer`
- number\_placed `Integer`
- achievement `string composed of 1s and 0s`
- used\_skin `Integer`
- streak `Integer`
- elo `Integer`

### EmailConfirm
Used to store the mail confirmation token send by email
- user `User foreign key`
- token `string url-safe`
- expires\_at `date iso format`

### DeleteConfirm
Used to store the deletion confirmation token send by email
- user `User foreign key`
- token `string url-safe`
- expires\_at `date iso format`

### Friendness
Used to store if 2 users are friends, lesser is the user with and id lesser than the other, it checks the following condition `lesser.id < greater.id` as ids are stored as integer by Django
- lesser `User foreign key`
- greater `User foreign key`
- since\_when `date iso format`

### FriendRequest
- from\_who `User foreign key`
- to\_who `User foreign key`

### FriendMessage
Uses the same system as `Friendness`, is\_from\_lesser is used to identify is the message was sent by the user with a lesser id
- lesser `User foreign key`
- greater `User foreign key`
- is\_from\_lesser `boolean`
- message `string`

# Features List

### Connect four
An online Connect 4 game where you can play against other people by sharing the game code with them, or play against an AI.
You can also watch other people's games as a spectator.

### friends
A Friends page is available where you can add, remove, view pending requests, and, most importantly, send messages to your friends.

### Achievements and skin
There is an achievement and skin system available. By completing certain actions, you'll unlock an achievement; you can then select it to receive the corresponding skin, which will then be visible in your games.

# Modules

# Individual Contributions

## axlleres

## lucmansa
I handled the entire React implementation, including the front-end API—which constantly sends requests to the back end to retrieve the desired information—as well as the HTML page structure and the visual design using CSS.

I ran into several difficulties while learning React because I was using it with TypeScript and had to learn that language at the same time, as well as CSS, which I also had to learn.

## guviure
*This project has been created as part of the 42 curriculum by axlleres, lucmansa, guviure*999\
,
,,mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm'
 





































 nbbb

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

# Team information

### axlleres
Team leader, backend

### lucmansa
frontend

### guviure
AI algorithm and implementation, bug-testing and fixer

# Project management
We meet every day do work togetheer to implement feature across fontend and backend and backend and IA algorythm

Github whas use to store the project online, git branch ase use to separete work

For distance communitication we use Discord with a private group


# Technical Stack

### Frontend
frontend use react for frontend, styling is css writing by hand

### Backend
backend use django
for it simplicity and efficacity

### Database
Database is mariadb
for it simplicity and efficacity

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
an online connect four

### friends
an friends page, to chat

### Achievements and skin


# Modules

# Individual Contributions

## axlleres

## lucmansa
all frontend, react implementation, html and css

## guviure
## Database format
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
Stats earned while playing, number\_placed representing who many times the user has placed a token,
used\_skin refer to the skin id, achievement represents earned achievement as 1s in a string,
streak can be negative if the user has lost multiple time a row or positive if won multiple in a row,
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

ROWS = 6
COLS = 7

EMPTY = 0
PLAYER = 1
AI = 2

DIFFICULTIES = {
    "easy": 2,
    "normal": 4,
    "hard": 6,
}


def get_valid_moves(board):
    moves = []

    for column in range(COLS):
        if board[0][column] == EMPTY:
            moves.append(column)

    return moves

def make_move(board, col, player):
    new_board= [row[:] for row in board]

    for row in range(ROWS -1, -1, -1):
        if new_board[row][col] == EMPTY:
            new_board[row][col] = player
            return new_board

    return None


def check_win(board, player):   
# HO
    for row in range(ROWS):
        for col in range(COLS - 3):
            if (board[row][col] == player
                and board[row][col + 1] == player
                and board[row][col + 2] == player
                and board[row][col + 3] == player):
                return True
# VE
    for row in range(ROWS - 3):
        for col in range(COLS):
            if (board[row][col] == player
                and board[row + 1][col] == player
                and board[row + 2][col] == player
                and board[row + 3][col] == player):
                return True
# DIAR
    for row in range (ROWS - 3):
        for col in range(COLS - 3):
            if (board[row][col] == player
                and board[row + 1][col + 1] == player
                and board[row + 2][col + 2] == player
                and board[row + 3][col + 3] == player):
                return True
# DIAL
    for row in range (3, ROWS):
        for col in range(COLS - 3):
            if (board[row][col] == player
                and board[row - 1][col + 1] == player
                and board[row - 2][col + 2] == player
                and board[row - 3][col + 3] == player):
                return True

    return False
	
def get_best_move(board, depth):

    return 0



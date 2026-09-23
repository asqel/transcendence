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


def evaluate_window(window):
    score = 0
    ai_count = window.count(AI)
    player_count == window.count(PLAYER)
    empty_count = window.count(EMPTY)

    if ai_count == 4:
        score += 100000
    elif ai_count == 3 and empty_count == 1:
        score += 100
    elif ai_count == 2 and empty_count == 2:
        score += 10

    if player_count == 3 and empty_count == 1:
        score -= 120
    elif player_count == 2 and empty_count == 2:
        score -= 10

    return score

def evaluate_board(board):
    score = 0

    center  = [board[row][COLS // 2] for row in range(ROWS)]
    score += center.count(AI) * 6

    #H
    for row in range(ROWS):
        for col in range(COLS - 3):
            window = board[row][col:col + 4]
            score += evaluate_window(window)

    #V
    for row in range(ROWS - 3):
        for col in range(COLS):
            window = [
                board[row][col],
                board[row + 1][col],
                board[row + 2][col],
                board[row + 3][col]
            ]
            score += evaluate_window(window)

    #D\
    for row in range(ROWS - 3):
        for col in range(COLS - 3):
            window = [
                board[row][col],
                board[row + 1][col + 1],
                board[row + 2][col + 2],
                board[row + 3][col + 3]
            ]
            score += evaluate_window(window)

    #D/
    for row in range(3, ROWS):
        for col in range(COLS - 3):
            window = [
                board[row][col],
                board[row - 1][col + 1],
                board[row - 2][col + 2],
                board[row - 3][col + 3]
            ]
            score += evaluate_window(window)

    return score

def minimax(board, depth, maximizing, alpha, beta):
    valid_moves = get_valid_moves(board)

    if check_win(board, AI):
        return None, 1000000

    if check_win(board, PLAYER):
        return None, -1000000

    if not valid_moves:
        return None, 0

    if depth == 0:
        return None, evaluate_board(board)

    if maximizing:
        best_score = -float("inf")
        best_col = valid_moves[0]
        for col in valid_moves:
            new_board = make_move(board, col, AI)
            _, score = minimax(
                new_board,
                depth - 1,
                False,
                alpha,
                beta
            )

            if score > best_score:
                best_score = score
                best_col = col

            alpha = max(alpha, best_score)

            if alpha >= beta:
                break

        return best_col, best_score

    best_score = float("inf")
    best_col = valid_moves[0]

    for col in valid_moves:
        new_board = make_move(board, col, PLAYER)
        _, score = minimax(
            new_board,
            depth - 1,
            True,
            alpha,
            beta
        )

        if score < best_score:
            best_score = score
            best_col = col

        beta = min(beta, best_score)

        if alpha >= beta:
            break

    return best_col, best_score


def get_best_move(board, difficulty):
    depth = DIFFICULTIES[difficulty]

    column, _ = minimax(
        board,
        depth,
        True,
        -float("inf"),
        float("inf")
    )

    return column
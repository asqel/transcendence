import { useEffect, useState } from "react";
import { globalApi, type LeaderboardResponse} from "../api";
import "./Leaderboard.css"

function Leaderboard() {
    const [loading, setLoading] = useState<boolean>(false);
    const [leaderboard, setLeaderboard] = useState<LeaderboardResponse|null>(null);
    const [error, setError] = useState<boolean>(false);

    async function fetchHistory() {
        setLoading(true);
        try{
            const res = await globalApi.get_leaderboard()
             setLeaderboard(res)
             console.log(res);
        }
        catch {
            setError(true);
        }
        finally {
                setLoading(false)
        }
    }
    
    useEffect(() => {
        fetchHistory();
    }, [])

    if (loading) {
        return (
            <div>Loading</div>   
        )
    }
    if (error) {
        return (
            <div>error</div>   
        )
    }
    return (
        <div className="leaderboard-page">
            <div className="leaderboard">
                {leaderboard?.board.map((player, index) => (
                    <p key={index}>#{index + 1}: {player[0]}, {player[1]} elo</p>
                ))}
            </div>
            { leaderboard?.self &&
                <div className="self">
                    <p>Rank: {leaderboard?.self}</p>
                </div>
            }
        </div>
    )
}
export default Leaderboard
import { useState, useEffect } from "react";
import { useImmer } from "use-immer";
import memoize from "lodash.memoize";

import Header from "./Header";
import Grid from "./Grid";
import AddGuessForm from "./AddGuessForm";

import words from "./words";
import solutions from "./solutions";
import { filterPossibilities, solve } from "./solver";
import optimalFirstGuesses from "./optimalFirstGuesses";

const memoizedSolve = memoize(
  solve,
  ({ guessResults, words, possibilities, searchWords, onProgress }) => {
    // cache key
    return JSON.stringify({ guessResults });
  }
);

function pluralize(n, word) {
  const plurals = {
    guess: "guesses",
    "optimal guess": "optimal guesses",
    possibility: "possibilities",
  };
  if (n === 1) return `${n} ${word}`;
  else return `${n} ${plurals[word]}`;
}

function App() {
  const [optimalGuesses, setOptimalGuesses] = useState([]);
  const [optimalGuessesLoading, setOptimalGuessesLoading] = useState(false);

  const [guessResults, updateGuessResults] = useImmer([
    // [
    //   { letter: "s", included: true, position: true },
    //   { letter: "e", included: false, position: false },
    //   { letter: "r", included: false, position: false },
    //   { letter: "a", included: false, position: false },
    //   { letter: "i", included: false, position: false },
    // ],
  ]);

  function addGuess(guess) {
    updateGuessResults((draft) => {
      draft.push(
        [...guess].map((letter) => ({
          letter,
          included: false,
          position: false,
        }))
      );
    });
  }

  const possibilities = filterPossibilities({
    words: solutions,
    guessResults,
  });

  useEffect(() => {
    setOptimalGuessesLoading(true);
    // recompute possibilities in the hook to avoid complicated infinite loop triggering logic
    const possibilities = filterPossibilities({
      words: solutions,
      guessResults,
    });
    if (possibilities?.length > 1) {
      // use precomputed first guesses to save initial loading time
      if (guessResults?.length === 0) {
        setOptimalGuesses(optimalFirstGuesses);
        setOptimalGuessesLoading(false);
        return;
      }

      // this can take a while
      const optimalGuesses = memoizedSolve({
        guessResults,
        words,
        possibilities,
        searchWords: true,
        onProgress: ({
          percent,
          word,
          minMaxWord,
          minMaxRemainingPossibilities,
        }) => {
          // console.log({ progress });
        },
      });
      console.log({ optimalGuesses });
      if (
        optimalGuesses.length > 0 &&
        optimalGuesses[0].maxRemainingPossibilities > 1
      ) {
        console.log("setting optimalGuesses");
        setOptimalGuessesLoading(false);
        setOptimalGuesses(optimalGuesses);
        return;
      }
    }
    setOptimalGuessesLoading(false);
    setOptimalGuesses([]);
  }, [guessResults, optimalGuesses.length]);

  return (
    <div className="dark:bg-gray-900 min-w-max min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto">
          <Header />
          <Grid
            guessResults={guessResults}
            updateGuessResults={updateGuessResults}
          />
          <AddGuessForm words={words} addGuess={addGuess} />

          <div className="flex justify-center items-center flex-col mt-4">
            <div className="w-80 h-[50vh] overflow-y-auto">
              <div className="relative">
                <div className="z-10 sticky top-0 bg-white border-b border-gray-200 py-1 text-sm font-medium text-gray-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400 w-80 text-center">
                  {!optimalGuessesLoading &&
                    pluralize(optimalGuesses.length, "optimal guess")}
                  {optimalGuessesLoading && "computing optimal guesses..."}
                </div>
                {!optimalGuessesLoading &&
                  optimalGuesses.map(({ word, maxRemainingPossibilities }) => (
                    <button
                      key={word}
                      className="px-3 py-3 w-80 text-3xl font-mono uppercase text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800 tracking-[0.5em]"
                      onClick={() => addGuess(word)}
                    >
                      {word}{" "}
                      <span className="tracking-normal text-sm absolute text-gray-500">
                        {maxRemainingPossibilities}
                      </span>
                    </button>
                  ))}

                <div className="z-10 sticky top-0 bg-white border-b border-gray-200 py-1 text-sm font-medium text-gray-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400 w-80 text-center">
                  {pluralize(possibilities.length, "possibility")}
                </div>
                {possibilities.map((possibility) => (
                  <button
                    key={possibility}
                    className="px-3 py-3 w-80 text-3xl font-mono uppercase text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800 tracking-[0.5em]"
                    onClick={() => addGuess(possibility)}
                  >
                    {possibility}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

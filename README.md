# nlparse
The purpose of this collection of code is to parse sentences.

Warning: You are very likely to discover slightly non-standard Linguistics in this repo.
(e.g. English preposition "to" is parsed as an auxiliary verb when forming the infinitive)
If this bothers you, feel free to fix it (via pull request) or open an issue telling me where I messed up.

Click [here](http://mr-martian.github.io/nlparse/demo.html) for a demo.

## TODO
- [x] rewrite Lisp code in JS
- [ ] current coding:
  - [ ] finish "friendly" IO
  - [ ] add "friendly" editing
  - [ ] discard old ```format.js```
  - [ ] finish ```friendly.css```
  - [x] finish ```demo.html```
  - [ ] finish ```langs/en/main.json```
    - as complete example
    - to be sure this stuff actually works for a whole language
- [x] syntax
  - [x] define rules
  - [x] apply rules
- [x] morphology
  - [x] define rules
  - [x] apply rules
  - [x] properly split sentences into words
- [ ] documentation
  - [ ] todo lists
    - [x] this
    - [ ] the list in language todo list (formerly at ```nlparse/langs/README.md```)
      - [ ] recreate
  - [ ] JSON format reference
    - [ ] for each value of ```"thisisa"```
    - [ ] for all the shorthands
- [ ] make a user friendly interface (for non-programmers)
  - [ ] syntax definer
    - [x] display rules
    - [ ] modify rules
    - [ ] correctly output rules
  - [ ] morphology definer
  - [x] make UI for program
  - [ ] make good UI for program
- [ ] correct "auxilary" to "auxiliary" throughout
- [ ] maybe possibly someday be able to do things with the parse trees?

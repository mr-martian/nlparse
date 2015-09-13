# nlparse
The purpose of this collection of code is to parse sentences.

Warning: You are very likely to discover slightly non-standard Linguistics in this repo.
(e.g. English preposition "to" is parsed as an auxiliary verb when forming the infinitive)
If this bothers you, feel free to fix it (via pull request) or open an issue telling me where I messed up.

## TODO
- [x] rewrite Lisp code in JS
- [x] syntax
  - [x] define rules
  - [x] apply rules
- [ ] morphology
  - [x] define rules
  - [ ] apply rules
    - may be done, requires further testing
- [ ] documentation
  - [ ] todo lists
    - [x] this
    - [ ] the list in language todo list (formerly at ```nlparse/langs/README.md```)
      - [ ] recreate
  - [ ] JSON format refference
    - for each value of ```"thisisa"```
- [ ] make a user friendly interface (for non-programmers)
  - [ ] syntax definer
    - [x] display rules
    - [x] modify rules
    - [ ] correctly output rules
  - [ ] morphology definer
  - [x] make UI for program
  - [ ] make good UI for program
- [ ] correct "auxilary" to "auxiliary" throughout
- [ ] maybe possibly someday be able to do things with the parse trees?

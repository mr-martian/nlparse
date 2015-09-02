# nlparse
The purpose of this collection of code is to parse sentences.

Warning: You are very likely to discover slightly non-standard Linguistics in this repo.
(e.g. English preposition "to" is parsed as an auxilary verb when forming the infinitive)
If this bothers you, feel free to fix it (via pull request) or open an issue telling me where I messed up.

Note, ```nlparse/morphology-utils.lisp``` depends on cl-ppcre, which it loads using quicklisp, which it assumes is in the default directory. If you are trying to use this yourself, you may need to change the first few lines of that file.

## TODO
- [x] syntax
  - [x] define rules
  - [x] apply rules
- [ ] morphology
  - [x] define rules
  - [ ] apply rules
- [ ] languages
  - see ```nlparse/langs/README.md```
  - [ ] add more languages (never check this box)
- [ ] documentation
  - [x] todo lists
    - [x] this
    - [x] the list in ```nlparse/langs```
  - [ ] any other documentation of any kind
    - sorry about that, any one trying to make sense of my code
    - the syntax rule format is sort of explained in the wiki
- [ ] make a user friendly interface (for non-programmers)
  - See ```nlparse/friendly```
  - [ ] syntax definer
    - [x] display rules
    - [ ] modify rules
  - [ ] morphology definer
  - [ ] compile program
    - [ ] Linux
    - [ ] Windows
    - [ ] Mac? (I can't do this myself)
  - [ ] make UI for program
    - maybe run a local HTTP server?
- [ ] maybe possibly someday be able to do things with the parse trees?

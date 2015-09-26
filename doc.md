# Documentation
All settings files are JSON text. All objects must have the parameter "thisisa". The following values are recognized:

## grammar
This is the toplevel object of the main file. It currently takes the following parameters:
- language
  - The language code, "en", "es", "zh", etc.
- syntax
  - An object, each key is the name of a rule and each value is that rule.
```JSON
{"adj-noun": [syntaxrule], "subject": [syntaxrule], ...}
```
- morphology
  - same as syntax, but each value can be "litdict", "load", or "morphologyrule".

## langname
Stored in the array in ```nlparse/langs/langs.json```, takes parameters "code", "shortname", "longname".
```JSON
{
  "thisisa": "langname",
  "code": "en",
  "shortname": "English",
  "longname": "Standard American English"
}
```
## litdict
## load
## merge
## morphologyrule
## node
## noderef
## or
## syntaxrule
## wildcard

## Substitutions
Because this stuff gets tedious to type, a feature has been added to allow certain strings to be equivalent to various structures in the main file (this will not work anywhere else at the moment).

|       string                             |            expansion                                         |        comment       |
|------------------------------------------|--------------------------------------------------------------|----------------------|
| ```"[a b c ...]"```                      |       ```[a, b, c, ...]```                                   |                      |
|      ```"$x"```                          | ```{"thisisa": "node", "type": x}```                         |                      |
|      ```"!x"```                          |        ```[x, null]```                                       |                      |
| ```$x{[a0 a1] [b0 b1] [c0 c1 c2] ...}``` | ```{"thisisa": "node", "type": x, a0: a1, b0: b1, c0: c1}``` |                      |
|             ```#x```                     | ```{"thisisa": "noderef", "node": x}```                      | x must be an integer |
|             ```@x```                     | ```{"thisisa": "wildcard", "id": x}```                       | x must be an integer |
|           ```(a b c ...)```              | ```{"thisisa": "or", "options": [a, b, c]}```                |                      |
|         ```+x```                         | ```{"thisisa": "merge", "things": x}```                      | x must be an array   |

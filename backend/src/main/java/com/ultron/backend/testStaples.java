package com.ultron.backend;
/*
Problem:
Staples runs a catalog system where each product listing includes a standardized attribute code string
 (think: a compact “spec code” used for search filters). Sometimes legacy listings use older codes, and Staples maintains
  a set of approved code-to-code remapping rules with associated operational costs.
You’re given:
Two 0-indexed strings sourceCode and targetCode, both of length n, consisting only of lowercase English letters.
sourceCode[i] is the attribute code currently stored for a listing at position i.
targetCode[i] is the attribute code Staples wants at position i.
Three 0-indexed arrays of equal length: fromCode (characters), toCode (characters), fee (integers),
 where fee[k] is the cost of applying the remapping rule:
Convert a single attribute letter fromCode[k] → toCode[k] at cost fee[k].
Operation Rules
You start with sourceCode. In one operation, you may pick any position in the current code string and change its character
 from x to y by paying cost z, only if there exists some index k such that:
fromCode[k] == x
toCode[k] == y
fee[k] == z
You may perform any number of operations, including applying multiple remappings to the same position (e.g., a → c → b).
Goal
Return the minimum total fee required to transform sourceCode into targetCode.
If it’s impossible to transform sourceCode into targetCode using the available remapping rules, return -1.
Notes
There may be multiple entries in the rule list with the same fromCode[k] and toCode[k] but different fees
(e.g., different vendor pipelines with different costs). You are allowed to choose whichever combination yields the minimum total cost.
Examples
Example 1
Input:
sourceCode = "abcd"
targetCode = "acbe"
fromCode = ["a","b","c","c","e","d"]
toCode   = ["b","c","b","e","b","e"]
fee      = [2,5,5,1,2,20]
Output: 28
Explanation (one optimal sequence):To migrate "abcd" → "acbe":
At index 1: b → c costs 5
At index 2: c → e costs 1
At index 2: e → b costs 2
At index 3: d → e costs 20
Total = 5 + 1 + 2 + 20 = 28, which is minimal.
Example 2
Input:
sourceCode = "aaaa"
targetCode = "bbbb"
fromCode = ["a","c"]
toCode   = ["c","b"]
fee      = [1,2]
Output: 12
Explanation:To change one a to b, the cheapest route is a → c (1), then c → b (2), total 3.
There are 4 positions, so total is 3 * 4 = 12.
Example 3
Input:
sourceCode = "abcd"
targetCode = "abce"
fromCode = ["a"]
toCode   = ["e"]
fee      = [10000]
Output: -1
Explanation:There is no way to remap d into e using the available rules.
Constraints (unchanged in difficulty)
1 <= n <= 10^5
sourceCode.length == targetCode.length == n
All strings and character arrays contain only lowercase English letters
1 <= fromCode.length == toCode.length == fee.length <= 2000
1 <= fee[k] <= 10^6
fromCode[k] != toCode[k]


 */
public class testStaples {
}

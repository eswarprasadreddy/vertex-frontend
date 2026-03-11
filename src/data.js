import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const API = import.meta.env.VITE_API_URL || "https://vertex-backend-1.onrender.com";

// ── API ────────────────────────────────────────────────────────────────────
const apiFetch = {
  get: async (path) => { const r = await fetch(`${API}${path}`); if(!r.ok) throw new Error(await r.text()); return r.json(); },
  post: async (path, body) => { const r = await fetch(`${API}${path}`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) }); if(!r.ok) throw new Error(await r.text()); return r.json(); },
};

// ── Theme ──────────────────────────────────────────────────────────────────
const DARK = { bg:"#09090f", surface:"#0f0f18", card:"#13131e", border:"#1e1e2e", borderH:"#3a3a5c", accent:"#5b8af5", accentS:"#0d1a3d", text:"#f0f0f8", sub:"#7070a0", muted:"#3a3a55", ok:"#34d399", okS:"#052016", bad:"#f87171", badS:"#260a0a", warn:"#f59e0b", warnS:"#1a1200" };
const LIGHT = { bg:"#f4f4fb", surface:"#ffffff", card:"#ffffff", border:"#dcdcea", borderH:"#9999cc", accent:"#3b6fe0", accentS:"#e2ebff", text:"#0a0a18", sub:"#50507a", muted:"#b0b0cc", ok:"#10b981", okS:"#e0faf2", bad:"#ef4444", badS:"#fef0f0", warn:"#d97706", warnS:"#fffbea" };

// ── Question Bank (hardcoded fallback) ─────────────────────────────────────
const QUESTION_BANK = {
  "Sliding Window": [
    { id:-1, title:"Maximum Sum Subarray of Size K", difficulty:"Easy", topic:"Arrays", pattern:"Sliding Window", question:`Title: Maximum Sum Subarray of Size K\nProblem Statement:\nGiven an array of integers and integer K, find the maximum sum of any contiguous subarray of size K.\n\nConstraints:\n• 1 ≤ K ≤ n ≤ 10⁵\n• -10⁴ ≤ nums[i] ≤ 10⁴\n\nExample 1:\nInput: nums = [2,1,5,1,3,2], K = 3\nOutput: 9\nReason: [5,1,3] = 9\n\nExample 2:\nInput: nums = [2,3,4,1,5], K = 2\nOutput: 7\nReason: [3,4] = 7\n\nHint: Maintain a running sum. Add the next element and remove the leftmost element each step.`, testCases:[{input:"nums=[2,1,5,1,3,2], k=3",expected:"9"},{input:"nums=[2,3,4,1,5], k=2",expected:"7"},{input:"nums=[1,1,1,1], k=2",expected:"2"}] },
    { id:-2, title:"Longest Substring Without Repeating Characters", difficulty:"Medium", topic:"Arrays", pattern:"Sliding Window", question:`Title: Longest Substring Without Repeating Characters\nProblem Statement:\nGiven a string s, find the length of the longest substring without repeating characters.\n\nConstraints:\n• 0 ≤ s.length ≤ 5×10⁴\n• s consists of English letters, digits, symbols and spaces\n\nExample 1:\nInput: s = "abcabcbb"\nOutput: 3\nReason: "abc"\n\nExample 2:\nInput: s = "bbbbb"\nOutput: 1\nReason: "b"\n\nHint: Use a HashMap to store the last index of each character. When a repeat is found, move the left pointer.`, testCases:[{input:'s="abcabcbb"',expected:"3"},{input:'s="bbbbb"',expected:"1"},{input:'s="pwwkew"',expected:"3"}] },
    { id:-3, title:"Fruits Into Baskets", difficulty:"Medium", topic:"Arrays", pattern:"Sliding Window", question:`Title: Fruits Into Baskets\nProblem Statement:\nYou have two baskets. Starting from any tree, pick fruits going right, but each basket can only hold ONE type of fruit. Return the max fruits you can pick.\n\nConstraints:\n• 1 ≤ fruits.length ≤ 10⁵\n• 0 ≤ fruits[i] < fruits.length\n\nExample 1:\nInput: fruits = [1,2,1]\nOutput: 3\n\nExample 2:\nInput: fruits = [0,1,2,2]\nOutput: 3\nReason: [1,2,2]\n\nHint: Sliding window with at most 2 distinct types. Use a HashMap to track counts.`, testCases:[{input:"fruits=[1,2,1]",expected:"3"},{input:"fruits=[0,1,2,2]",expected:"3"},{input:"fruits=[1,2,3,2,2]",expected:"4"}] },
    { id:-4, title:"Minimum Size Subarray Sum", difficulty:"Medium", topic:"Arrays", pattern:"Sliding Window", question:`Title: Minimum Size Subarray Sum\nProblem Statement:\nGiven an array of positive integers and a target, return the minimal length of a subarray whose sum ≥ target. Return 0 if impossible.\n\nConstraints:\n• 1 ≤ target ≤ 10⁹\n• 1 ≤ nums.length ≤ 10⁵\n\nExample 1:\nInput: target = 7, nums = [2,3,1,2,4,3]\nOutput: 2\nReason: [4,3]\n\nExample 2:\nInput: target = 4, nums = [1,4,4]\nOutput: 1\n\nHint: Expand right pointer to reach the target, then shrink left pointer to find minimum length.`, testCases:[{input:"target=7, nums=[2,3,1,2,4,3]",expected:"2"},{input:"target=4, nums=[1,4,4]",expected:"1"},{input:"target=11, nums=[1,1,1,1,1]",expected:"0"}] },
    { id:-5, title:"Longest Subarray with Ones After Replacement", difficulty:"Hard", topic:"Arrays", pattern:"Sliding Window", question:`Title: Longest Subarray with Ones After Replacement\nProblem Statement:\nGiven a binary array and integer k, return the length of the longest subarray with all 1s after replacing at most k 0s.\n\nConstraints:\n• 1 ≤ arr.length ≤ 10⁵\n• arr[i] is 0 or 1\n• 0 ≤ k ≤ arr.length\n\nExample 1:\nInput: arr = [0,1,1,0,0,0,1,1,0], k = 2\nOutput: 5\nReason: Replace indices 3,4 → [1,1,1,1,1]\n\nExample 2:\nInput: arr = [0,1,0,0,1,1,0,1,1,0,0,1,1], k = 3\nOutput: 9\n\nHint: Window size - count(1s) ≤ k. When violated, shrink left.`, testCases:[{input:"arr=[0,1,1,0,0,0,1,1,0], k=2",expected:"5"},{input:"arr=[0,0,0,1], k=1",expected:"2"},{input:"arr=[1,1,1,1], k=2",expected:"4"}] },
    { id:-6, title:"Permutation in String", difficulty:"Medium", topic:"Strings", pattern:"Sliding Window", question:`Title: Permutation in String\nProblem Statement:\nGiven strings s1 and s2, return true if s2 contains any permutation of s1 as a substring.\n\nConstraints:\n• 1 ≤ s1.length, s2.length ≤ 10⁴\n• Both strings consist of lowercase letters\n\nExample 1:\nInput: s1 = "ab", s2 = "eidbaooo"\nOutput: true (s2 contains "ba")\n\nExample 2:\nInput: s1 = "ab", s2 = "eidboaoo"\nOutput: false\n\nHint: Use a fixed-size window of length s1.length. Compare frequency arrays.`, testCases:[{input:'s1="ab", s2="eidbaooo"',expected:"true"},{input:'s1="ab", s2="eidboaoo"',expected:"false"}] },
    { id:-7, title:"Find All Anagrams in a String", difficulty:"Medium", topic:"Strings", pattern:"Sliding Window", question:`Title: Find All Anagrams in a String\nProblem Statement:\nGiven strings s and p, return a list of all start indices of p's anagrams in s.\n\nExample 1:\nInput: s = "cbaebabacd", p = "abc"\nOutput: [0, 6]\n\nExample 2:\nInput: s = "abab", p = "ab"\nOutput: [0, 1, 2]\n\nHint: Fixed window of size p.length, compare frequency maps.`, testCases:[{input:'s="cbaebabacd", p="abc"',expected:"[0,6]"},{input:'s="abab", p="ab"',expected:"[0,1,2]"}] },
    { id:-8, title:"Max Consecutive Ones III", difficulty:"Medium", topic:"Arrays", pattern:"Sliding Window", question:`Title: Max Consecutive Ones III\nProblem Statement:\nGiven a binary array and integer k, return the maximum number of consecutive 1s if you can flip at most k 0s.\n\nExample 1:\nInput: nums = [1,1,1,0,0,0,1,1,1,1,0], k = 2\nOutput: 6\nReason: [1,1,1,0,0,1,1,1,1,1,1] → flip index 5 and 10\n\nHint: Maintain window where count of 0s ≤ k.`, testCases:[{input:"nums=[1,1,1,0,0,0,1,1,1,1,0], k=2",expected:"6"},{input:"nums=[0,0,1,1,0,0,1,1,1,0,1,1,0,0,0,1,1,1,1], k=3",expected:"10"}] },
    { id:-9, title:"Subarray Product Less Than K", difficulty:"Medium", topic:"Arrays", pattern:"Sliding Window", question:`Title: Subarray Product Less Than K\nProblem Statement:\nGiven an array of positive integers and integer k, return the number of contiguous subarrays where the product of all elements is less than k.\n\nExample 1:\nInput: nums = [10,5,2,6], k = 100\nOutput: 8\nReason: [10],[5],[2],[6],[10,5],[5,2],[2,6],[5,2,6]\n\nHint: Maintain window product. Each valid window ending at r contributes (r - l + 1) subarrays.`, testCases:[{input:"nums=[10,5,2,6], k=100",expected:"8"},{input:"nums=[1,2,3], k=0",expected:"0"}] },
    { id:-10, title:"Minimum Window Substring", difficulty:"Hard", topic:"Strings", pattern:"Sliding Window", question:`Title: Minimum Window Substring\nProblem Statement:\nGiven strings s and t, return the minimum window substring of s that contains all characters of t. Return "" if no such window exists.\n\nExample 1:\nInput: s = "ADOBECODEBANC", t = "ABC"\nOutput: "BANC"\n\nExample 2:\nInput: s = "a", t = "a"\nOutput: "a"\n\nHint: Use two frequency maps. Expand right until all chars covered, then shrink left to minimize.`, testCases:[{input:'s="ADOBECODEBANC", t="ABC"',expected:'"BANC"'},{input:'s="a", t="a"',expected:'"a"'},{input:'s="a", t="aa"',expected:'""'}] },
  ],

  "Two Pointers": [
    { id:-11, title:"Two Sum (Sorted Array)", difficulty:"Easy", topic:"Arrays", pattern:"Two Pointers", question:`Title: Two Sum (Sorted Array)\nProblem Statement:\nGiven a sorted array, find two numbers that add up to a target. Return their 1-indexed positions.\n\nExample 1:\nInput: numbers = [2,7,11,15], target = 9\nOutput: [1,2]\n\nExample 2:\nInput: numbers = [2,3,4], target = 6\nOutput: [1,3]\n\nHint: Place one pointer at start, one at end. Move based on sum vs target.`, testCases:[{input:"numbers=[2,7,11,15], target=9",expected:"[1,2]"},{input:"numbers=[2,3,4], target=6",expected:"[1,3]"}] },
    { id:-12, title:"Remove Duplicates from Sorted Array", difficulty:"Easy", topic:"Arrays", pattern:"Two Pointers", question:`Title: Remove Duplicates from Sorted Array\nProblem Statement:\nGiven a sorted array, remove duplicates in-place. Return the count of unique elements.\n\nExample 1:\nInput: nums = [1,1,2]\nOutput: 2, nums = [1,2,...]\n\nExample 2:\nInput: nums = [0,0,1,1,1,2,2,3,3,4]\nOutput: 5\n\nHint: Slow pointer tracks the position of last unique. Fast pointer scans ahead.`, testCases:[{input:"nums=[1,1,2]",expected:"2"},{input:"nums=[0,0,1,1,1,2,2,3,3,4]",expected:"5"}] },
    { id:-13, title:"Container With Most Water", difficulty:"Medium", topic:"Arrays", pattern:"Two Pointers", question:`Title: Container With Most Water\nProblem Statement:\nGiven n heights, find two lines that together with the x-axis form a container that holds the most water.\n\nExample 1:\nInput: height = [1,8,6,2,5,4,8,3,7]\nOutput: 49\n\nHint: Move the pointer with the smaller height inward — the larger one is the bottleneck.`, testCases:[{input:"height=[1,8,6,2,5,4,8,3,7]",expected:"49"},{input:"height=[1,1]",expected:"1"}] },
    { id:-14, title:"3Sum", difficulty:"Medium", topic:"Arrays", pattern:"Two Pointers", question:`Title: 3Sum\nProblem Statement:\nFind all unique triplets in the array that sum to zero.\n\nExample 1:\nInput: nums = [-1,0,1,2,-1,-4]\nOutput: [[-1,-1,2],[-1,0,1]]\n\nExample 2:\nInput: nums = [0,0,0]\nOutput: [[0,0,0]]\n\nHint: Sort first. For each element, use two pointers on the rest. Skip duplicates carefully.`, testCases:[{input:"nums=[-1,0,1,2,-1,-4]",expected:"[[-1,-1,2],[-1,0,1]]"},{input:"nums=[0,0,0]",expected:"[[0,0,0]]"}] },
    { id:-15, title:"Trapping Rain Water", difficulty:"Hard", topic:"Arrays", pattern:"Two Pointers", question:`Title: Trapping Rain Water\nProblem Statement:\nGiven elevation heights, compute how much water can be trapped after raining.\n\nExample 1:\nInput: height = [0,1,0,2,1,0,1,3,2,1,2,1]\nOutput: 6\n\nExample 2:\nInput: height = [4,2,0,3,2,5]\nOutput: 9\n\nHint: Track maxLeft and maxRight with two pointers. Water at each position = min(maxL, maxR) - height[i].`, testCases:[{input:"height=[0,1,0,2,1,0,1,3,2,1,2,1]",expected:"6"},{input:"height=[4,2,0,3,2,5]",expected:"9"}] },
    { id:-16, title:"Sort Colors (Dutch National Flag)", difficulty:"Medium", topic:"Arrays", pattern:"Two Pointers", question:`Title: Sort Colors\nProblem Statement:\nSort array containing only 0s, 1s, 2s in-place without extra space.\n\nExample 1:\nInput: nums = [2,0,2,1,1,0]\nOutput: [0,0,1,1,2,2]\n\nHint: Three-way partition. low pointer for 0s, high pointer for 2s, mid scans.`, testCases:[{input:"nums=[2,0,2,1,1,0]",expected:"[0,0,1,1,2,2]"},{input:"nums=[2,0,1]",expected:"[0,1,2]"}] },
    { id:-17, title:"Palindrome Check with Two Pointers", difficulty:"Easy", topic:"Strings", pattern:"Two Pointers", question:`Title: Valid Palindrome\nProblem Statement:\nA phrase is a palindrome if it reads the same forward and backward after lowercasing and removing non-alphanumeric chars.\n\nExample 1:\nInput: s = "A man, a plan, a canal: Panama"\nOutput: true\n\nExample 2:\nInput: s = "race a car"\nOutput: false\n\nHint: Two pointers from both ends, skip non-alphanumeric chars.`, testCases:[{input:'s="A man, a plan, a canal: Panama"',expected:"true"},{input:'s="race a car"',expected:"false"}] },
    { id:-18, title:"4Sum", difficulty:"Medium", topic:"Arrays", pattern:"Two Pointers", question:`Title: 4Sum\nProblem Statement:\nFind all unique quadruplets that sum to target.\n\nExample 1:\nInput: nums = [1,0,-1,0,-2,2], target = 0\nOutput: [[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]\n\nHint: Two nested loops + two pointers. Sort first. Skip duplicates at every level.`, testCases:[{input:"nums=[1,0,-1,0,-2,2], target=0",expected:"[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]"}] },
    { id:-19, title:"Squares of a Sorted Array", difficulty:"Easy", topic:"Arrays", pattern:"Two Pointers", question:`Title: Squares of a Sorted Array\nProblem Statement:\nGiven sorted array, return array of squares in sorted order.\n\nExample 1:\nInput: nums = [-4,-1,0,3,10]\nOutput: [0,1,9,16,100]\n\nHint: Largest squares are at either end. Compare abs values and fill result from right to left.`, testCases:[{input:"nums=[-4,-1,0,3,10]",expected:"[0,1,9,16,100]"},{input:"nums=[-7,-3,2,3,11]",expected:"[4,9,9,49,121]"}] },
    { id:-20, title:"Move Zeroes", difficulty:"Easy", topic:"Arrays", pattern:"Two Pointers", question:`Title: Move Zeroes\nProblem Statement:\nMove all 0s to end while maintaining relative order of non-zero elements. In-place.\n\nExample 1:\nInput: nums = [0,1,0,3,12]\nOutput: [1,3,12,0,0]\n\nHint: Slow pointer marks next position for non-zero. Fast pointer finds non-zeros.`, testCases:[{input:"nums=[0,1,0,3,12]",expected:"[1,3,12,0,0]"},{input:"nums=[0]",expected:"[0]"}] },
  ],

  "Binary Search": [
    { id:-21, title:"Binary Search", difficulty:"Easy", topic:"Arrays", pattern:"Binary Search", question:`Title: Binary Search\nProblem Statement:\nGiven a sorted array and target, return its index. Return -1 if not found.\n\nExample 1:\nInput: nums = [-1,0,3,5,9,12], target = 9\nOutput: 4\n\nExample 2:\nInput: nums = [-1,0,3,5,9,12], target = 2\nOutput: -1\n\nHint: mid = left + (right - left) / 2 to avoid overflow.`, testCases:[{input:"nums=[-1,0,3,5,9,12], target=9",expected:"4"},{input:"nums=[-1,0,3,5,9,12], target=2",expected:"-1"}] },
    { id:-22, title:"Find First and Last Position", difficulty:"Medium", topic:"Arrays", pattern:"Binary Search", question:`Title: Find First and Last Position of Element\nProblem Statement:\nFind starting and ending positions of target in sorted array. Return [-1,-1] if not found.\n\nExample 1:\nInput: nums = [5,7,7,8,8,10], target = 8\nOutput: [3,4]\n\nExample 2:\nInput: nums = [5,7,7,8,8,10], target = 6\nOutput: [-1,-1]\n\nHint: Two binary searches: one biased left, one biased right.`, testCases:[{input:"nums=[5,7,7,8,8,10], target=8",expected:"[3,4]"},{input:"nums=[5,7,7,8,8,10], target=6",expected:"[-1,-1]"}] },
    { id:-23, title:"Search in Rotated Sorted Array", difficulty:"Medium", topic:"Arrays", pattern:"Binary Search", question:`Title: Search in Rotated Sorted Array\nProblem Statement:\nArray was rotated at some pivot. Search for target and return index, or -1.\n\nExample 1:\nInput: nums = [4,5,6,7,0,1,2], target = 0\nOutput: 4\n\nExample 2:\nInput: nums = [4,5,6,7,0,1,2], target = 3\nOutput: -1\n\nHint: Determine which half is sorted, then check if target lies in that half.`, testCases:[{input:"nums=[4,5,6,7,0,1,2], target=0",expected:"4"},{input:"nums=[4,5,6,7,0,1,2], target=3",expected:"-1"}] },
    { id:-24, title:"Find Minimum in Rotated Sorted Array", difficulty:"Medium", topic:"Arrays", pattern:"Binary Search", question:`Title: Find Minimum in Rotated Sorted Array\nProblem Statement:\nFind the minimum element in a rotated sorted array with unique elements.\n\nExample 1:\nInput: nums = [3,4,5,1,2]\nOutput: 1\n\nExample 2:\nInput: nums = [4,5,6,7,0,1,2]\nOutput: 0\n\nHint: If nums[mid] > nums[right], the minimum is in the right half.`, testCases:[{input:"nums=[3,4,5,1,2]",expected:"1"},{input:"nums=[4,5,6,7,0,1,2]",expected:"0"},{input:"nums=[11,13,15,17]",expected:"11"}] },
    { id:-25, title:"Koko Eating Bananas", difficulty:"Medium", topic:"Arrays", pattern:"Binary Search", question:`Title: Koko Eating Bananas\nProblem Statement:\nKoko must eat all bananas within h hours. Each hour she eats at most k bananas from one pile. Find minimum k.\n\nExample 1:\nInput: piles = [3,6,7,11], h = 8\nOutput: 4\n\nExample 2:\nInput: piles = [30,11,23,4,20], h = 5\nOutput: 30\n\nHint: Binary search on k. Check if total hours ≤ h for a given k.`, testCases:[{input:"piles=[3,6,7,11], h=8",expected:"4"},{input:"piles=[30,11,23,4,20], h=5",expected:"30"}] },
    { id:-26, title:"Find Peak Element", difficulty:"Medium", topic:"Arrays", pattern:"Binary Search", question:`Title: Find Peak Element\nProblem Statement:\nA peak element is greater than its neighbors. Find a peak index. O(log n) required.\n\nExample 1:\nInput: nums = [1,2,3,1]\nOutput: 2\n\nExample 2:\nInput: nums = [1,2,1,3,5,6,4]\nOutput: 1 or 5\n\nHint: If nums[mid] < nums[mid+1], peak is to the right. Else peak is to the left or at mid.`, testCases:[{input:"nums=[1,2,3,1]",expected:"2"},{input:"nums=[1,2,1,3,5,6,4]",expected:"5"}] },
    { id:-27, title:"Search a 2D Matrix", difficulty:"Medium", topic:"Arrays", pattern:"Binary Search", question:`Title: Search a 2D Matrix\nProblem Statement:\nSearched sorted matrix where each row starts after last row ends. Return true if target exists.\n\nExample 1:\nInput: matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3\nOutput: true\n\nHint: Treat the 2D matrix as a 1D sorted array. mid_row = mid / cols, mid_col = mid % cols.`, testCases:[{input:"matrix=[[1,3,5,7],[10,11,16,20],[23,30,34,60]], target=3",expected:"true"},{input:"matrix=[[1,3,5,7],[10,11,16,20],[23,30,34,60]], target=13",expected:"false"}] },
    { id:-28, title:"Capacity To Ship Packages", difficulty:"Medium", topic:"Arrays", pattern:"Binary Search", question:`Title: Capacity to Ship Packages Within D Days\nProblem Statement:\nFind the minimum weight capacity of a ship to ship all packages within D days.\n\nExample 1:\nInput: weights = [1,2,3,4,5,6,7,8,9,10], days = 5\nOutput: 15\n\nHint: Binary search between max(weights) and sum(weights).`, testCases:[{input:"weights=[1,2,3,4,5,6,7,8,9,10], days=5",expected:"15"},{input:"weights=[3,2,2,4,1,4], days=3",expected:"6"}] },
    { id:-29, title:"Sqrt(x)", difficulty:"Easy", topic:"Arrays", pattern:"Binary Search", question:`Title: Sqrt(x)\nProblem Statement:\nCompute integer square root of x without using sqrt().\n\nExample 1:\nInput: x = 4\nOutput: 2\n\nExample 2:\nInput: x = 8\nOutput: 2 (floor of 2.82...)\n\nHint: Binary search between 1 and x. Check if mid*mid ≤ x.`, testCases:[{input:"x=4",expected:"2"},{input:"x=8",expected:"2"},{input:"x=0",expected:"0"}] },
    { id:-30, title:"Count Negatives in Sorted Matrix", difficulty:"Easy", topic:"Arrays", pattern:"Binary Search", question:`Title: Count Negative Numbers in a Sorted Matrix\nProblem Statement:\nGiven an m×n matrix sorted in non-increasing order, return count of negatives.\n\nExample 1:\nInput: grid = [[4,3,2,-1],[3,2,1,-1],[1,1,-1,-2],[-1,-1,-2,-3]]\nOutput: 8\n\nHint: Binary search per row to find first negative index.`, testCases:[{input:"grid=[[4,3,2,-1],[3,2,1,-1],[1,1,-1,-2],[-1,-1,-2,-3]]",expected:"8"},{input:"grid=[[3,2],[1,0]]",expected:"0"}] },
  ],

  "DFS": [
    { id:-31, title:"Max Depth of Binary Tree", difficulty:"Easy", topic:"Trees", pattern:"DFS", question:`Title: Maximum Depth of Binary Tree\nProblem Statement:\nGiven root of a binary tree, return its maximum depth.\n\nExample 1:\nInput: root = [3,9,20,null,null,15,7]\nOutput: 3\n\nExample 2:\nInput: root = [1,null,2]\nOutput: 2\n\nHint: depth = 1 + max(dfs(left), dfs(right)). Base case: null node returns 0.`, testCases:[{input:"root=[3,9,20,null,null,15,7]",expected:"3"},{input:"root=[1,null,2]",expected:"2"}] },
    { id:-32, title:"Path Sum", difficulty:"Easy", topic:"Trees", pattern:"DFS", question:`Title: Path Sum\nProblem Statement:\nGiven root and targetSum, return true if any root-to-leaf path sum equals targetSum.\n\nExample 1:\nInput: root = [5,4,8,11,null,13,4,7,2,null,null,null,1], targetSum = 22\nOutput: true\n\nHint: At each node subtract node.val from target. Return true at leaf if remaining == 0.`, testCases:[{input:"root=[5,4,8,11,null,13,4,7,2,null,null,null,1], targetSum=22",expected:"true"},{input:"root=[1,2,3], targetSum=5",expected:"false"}] },
    { id:-33, title:"Validate Binary Search Tree", difficulty:"Medium", topic:"Trees", pattern:"DFS", question:`Title: Validate Binary Search Tree\nProblem Statement:\nGiven root, determine if it is a valid BST.\n\nExample 1:\nInput: root = [2,1,3]\nOutput: true\n\nExample 2:\nInput: root = [5,1,4,null,null,3,6]\nOutput: false\n\nHint: Pass min and max bounds down. Left child must be < node.val, right must be > node.val.`, testCases:[{input:"root=[2,1,3]",expected:"true"},{input:"root=[5,1,4,null,null,3,6]",expected:"false"}] },
    { id:-34, title:"Symmetric Tree", difficulty:"Easy", topic:"Trees", pattern:"DFS", question:`Title: Symmetric Tree\nProblem Statement:\nGiven root of binary tree, check whether it is a mirror of itself.\n\nExample 1:\nInput: root = [1,2,2,3,4,4,3]\nOutput: true\n\nExample 2:\nInput: root = [1,2,2,null,3,null,3]\nOutput: false\n\nHint: Compare left.left with right.right and left.right with right.left recursively.`, testCases:[{input:"root=[1,2,2,3,4,4,3]",expected:"true"},{input:"root=[1,2,2,null,3,null,3]",expected:"false"}] },
    { id:-35, title:"Lowest Common Ancestor", difficulty:"Medium", topic:"Trees", pattern:"DFS", question:`Title: Lowest Common Ancestor of a Binary Tree\nProblem Statement:\nFind the LCA of two nodes p and q in a binary tree.\n\nExample 1:\nInput: root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1\nOutput: 3\n\nExample 2:\nInput: same tree, p = 5, q = 4\nOutput: 5\n\nHint: If current node is p or q return it. If both subtrees return non-null, current is LCA.`, testCases:[{input:"p=5, q=1",expected:"3"},{input:"p=5, q=4",expected:"5"}] },
    { id:-36, title:"Binary Tree Level Order Traversal", difficulty:"Medium", topic:"Trees", pattern:"DFS", question:`Title: Binary Tree Level Order Traversal\nProblem Statement:\nReturn level-order traversal as list of lists.\n\nExample 1:\nInput: root = [3,9,20,null,null,15,7]\nOutput: [[3],[9,20],[15,7]]\n\nHint: DFS with depth parameter. result[depth].add(node.val).`, testCases:[{input:"root=[3,9,20,null,null,15,7]",expected:"[[3],[9,20],[15,7]]"},{input:"root=[1]",expected:"[[1]]"}] },
    { id:-37, title:"Number of Islands", difficulty:"Medium", topic:"Graphs", pattern:"DFS", question:`Title: Number of Islands\nProblem Statement:\nGiven 2D grid of '1's (land) and '0's (water), count number of islands.\n\nExample 1:\nInput: grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]\nOutput: 1\n\nHint: DFS from each unvisited '1'. Mark visited cells as '0'.`, testCases:[{input:"grid=[['1','1','0'],['0','1','0'],['0','0','1']]",expected:"2"}] },
    { id:-38, title:"Path Sum II (All Paths)", difficulty:"Medium", topic:"Trees", pattern:"DFS", question:`Title: Path Sum II\nProblem Statement:\nFind all root-to-leaf paths where sum equals targetSum.\n\nExample 1:\nInput: root = [5,4,8,11,null,13,4,7,2,null,null,5,1], targetSum = 22\nOutput: [[5,4,11,2],[5,8,4,5]]\n\nHint: Backtracking DFS. Add to path, recurse, then remove (backtrack).`, testCases:[{input:"root=[5,4,8,11,null,13,4,7,2,null,null,5,1], targetSum=22",expected:"[[5,4,11,2],[5,8,4,5]]"}] },
    { id:-39, title:"Invert Binary Tree", difficulty:"Easy", topic:"Trees", pattern:"DFS", question:`Title: Invert Binary Tree\nProblem Statement:\nInvert a binary tree (mirror it).\n\nExample 1:\nInput: root = [4,2,7,1,3,6,9]\nOutput: [4,7,2,9,6,3,1]\n\nHint: Swap left and right, then recursively invert both.`, testCases:[{input:"root=[4,2,7,1,3,6,9]",expected:"[4,7,2,9,6,3,1]"},{input:"root=[2,1,3]",expected:"[2,3,1]"}] },
    { id:-40, title:"Clone Graph", difficulty:"Medium", topic:"Graphs", pattern:"DFS", question:`Title: Clone Graph\nProblem Statement:\nGiven a reference of a node in a connected undirected graph, return a deep copy.\n\nExample 1:\nInput: adjList = [[2,4],[1,3],[2,4],[1,3]]\nOutput: Deep copy of same structure\n\nHint: Use HashMap<Node, Node> to map original → clone. DFS to clone neighbors.`, testCases:[{input:"adjList=[[2,4],[1,3],[2,4],[1,3]]",expected:"Deep copy returned"}] },
  ],

  "Dynamic Programming": [
    { id:-41, title:"Climbing Stairs", difficulty:"Easy", topic:"Dynamic Programming", pattern:"Dynamic Programming", question:`Title: Climbing Stairs\nProblem Statement:\nTo reach the top of n stairs, you can climb 1 or 2 steps. How many distinct ways?\n\nExample 1:\nInput: n = 2\nOutput: 2\n\nExample 2:\nInput: n = 3\nOutput: 3 (1+1+1, 1+2, 2+1)\n\nHint: f(n) = f(n-1) + f(n-2). It's Fibonacci!`, testCases:[{input:"n=2",expected:"2"},{input:"n=3",expected:"3"},{input:"n=10",expected:"89"}] },
    { id:-42, title:"Coin Change", difficulty:"Medium", topic:"Dynamic Programming", pattern:"Dynamic Programming", question:`Title: Coin Change\nProblem Statement:\nGiven coins of different denominations and amount, find the fewest coins to make up that amount. Return -1 if impossible.\n\nExample 1:\nInput: coins = [1,5,6,9], amount = 11\nOutput: 2\n\nExample 2:\nInput: coins = [2], amount = 3\nOutput: -1\n\nHint: dp[i] = min coins to reach i. For each coin, dp[i] = min(dp[i], dp[i-coin]+1).`, testCases:[{input:"coins=[1,5,6,9], amount=11",expected:"2"},{input:"coins=[2], amount=3",expected:"-1"},{input:"coins=[1,2,5], amount=11",expected:"3"}] },
    { id:-43, title:"Longest Common Subsequence", difficulty:"Medium", topic:"Dynamic Programming", pattern:"Dynamic Programming", question:`Title: Longest Common Subsequence\nProblem Statement:\nGiven two strings, return the length of their longest common subsequence.\n\nExample 1:\nInput: text1 = "abcde", text2 = "ace"\nOutput: 3 ("ace")\n\nExample 2:\nInput: text1 = "abc", text2 = "abc"\nOutput: 3\n\nHint: dp[i][j] = LCS of text1[0..i] and text2[0..j]. If chars match, 1 + dp[i-1][j-1]. Else max(dp[i-1][j], dp[i][j-1]).`, testCases:[{input:'text1="abcde", text2="ace"',expected:"3"},{input:'text1="abc", text2="abc"',expected:"3"},{input:'text1="abc", text2="def"',expected:"0"}] },
    { id:-44, title:"0/1 Knapsack", difficulty:"Medium", topic:"Dynamic Programming", pattern:"Dynamic Programming", question:`Title: 0/1 Knapsack\nProblem Statement:\nGiven weights and values of n items, and capacity W. Find max value you can get without exceeding W. Each item can be taken at most once.\n\nExample 1:\nInput: weights=[2,3,4,5], values=[3,4,5,6], W=5\nOutput: 7\n\nHint: dp[i][w] = max value using first i items with capacity w.`, testCases:[{input:"weights=[2,3,4,5], values=[3,4,5,6], W=5",expected:"7"},{input:"weights=[1,2,3], values=[6,10,12], W=5",expected:"22"}] },
    { id:-45, title:"Longest Increasing Subsequence", difficulty:"Medium", topic:"Dynamic Programming", pattern:"Dynamic Programming", question:`Title: Longest Increasing Subsequence\nProblem Statement:\nReturn the length of the longest strictly increasing subsequence.\n\nExample 1:\nInput: nums = [10,9,2,5,3,7,101,18]\nOutput: 4 ([2,3,7,101])\n\nExample 2:\nInput: nums = [0,1,0,3,2,3]\nOutput: 4\n\nHint: dp[i] = length of LIS ending at index i. For each j < i, if nums[j] < nums[i], dp[i] = max(dp[i], dp[j]+1).`, testCases:[{input:"nums=[10,9,2,5,3,7,101,18]",expected:"4"},{input:"nums=[0,1,0,3,2,3]",expected:"4"}] },
    { id:-46, title:"House Robber", difficulty:"Medium", topic:"Dynamic Programming", pattern:"Dynamic Programming", question:`Title: House Robber\nProblem Statement:\nCannot rob two adjacent houses. Maximize total.\n\nExample 1:\nInput: nums = [1,2,3,1]\nOutput: 4 (rob 1 and 3)\n\nExample 2:\nInput: nums = [2,7,9,3,1]\nOutput: 12\n\nHint: dp[i] = max(dp[i-1], dp[i-2] + nums[i]).`, testCases:[{input:"nums=[1,2,3,1]",expected:"4"},{input:"nums=[2,7,9,3,1]",expected:"12"}] },
    { id:-47, title:"Word Break", difficulty:"Medium", topic:"Dynamic Programming", pattern:"Dynamic Programming", question:`Title: Word Break\nProblem Statement:\nGiven string s and wordDict, return true if s can be segmented into words from dict.\n\nExample 1:\nInput: s = "leetcode", wordDict = ["leet","code"]\nOutput: true\n\nExample 2:\nInput: s = "applepenapple", wordDict = ["apple","pen"]\nOutput: true\n\nHint: dp[i] = true if s[0..i] can be segmented. Check all j < i where dp[j] is true and s[j..i] is in dict.`, testCases:[{input:'s="leetcode", wordDict=["leet","code"]',expected:"true"},{input:'s="catsandog", wordDict=["cats","dog","sand","and","cat"]',expected:"false"}] },
    { id:-48, title:"Unique Paths", difficulty:"Medium", topic:"Dynamic Programming", pattern:"Dynamic Programming", question:`Title: Unique Paths\nProblem Statement:\nA robot on m×n grid can only move right or down. How many unique paths to bottom-right?\n\nExample 1:\nInput: m = 3, n = 7\nOutput: 28\n\nExample 2:\nInput: m = 3, n = 2\nOutput: 3\n\nHint: dp[i][j] = dp[i-1][j] + dp[i][j-1].`, testCases:[{input:"m=3, n=7",expected:"28"},{input:"m=3, n=2",expected:"3"}] },
    { id:-49, title:"Jump Game", difficulty:"Medium", topic:"Dynamic Programming", pattern:"Dynamic Programming", question:`Title: Jump Game\nProblem Statement:\nGiven array where nums[i] is max jump length, can you reach the last index?\n\nExample 1:\nInput: nums = [2,3,1,1,4]\nOutput: true\n\nExample 2:\nInput: nums = [3,2,1,0,4]\nOutput: false\n\nHint: Track maxReach. If i > maxReach return false. maxReach = max(maxReach, i + nums[i]).`, testCases:[{input:"nums=[2,3,1,1,4]",expected:"true"},{input:"nums=[3,2,1,0,4]",expected:"false"}] },
    { id:-50, title:"Edit Distance", difficulty:"Hard", topic:"Dynamic Programming", pattern:"Dynamic Programming", question:`Title: Edit Distance\nProblem Statement:\nFind minimum operations (insert, delete, replace) to convert word1 to word2.\n\nExample 1:\nInput: word1 = "horse", word2 = "ros"\nOutput: 3\n\nHint: dp[i][j] = edit distance for word1[0..i] and word2[0..j]. If chars match, dp[i][j] = dp[i-1][j-1]. Else 1 + min(insert, delete, replace).`, testCases:[{input:'word1="horse", word2="ros"',expected:"3"},{input:'word1="intention", word2="execution"',expected:"5"}] },
  ],
};

// Pattern approach guides
const PATTERN_GUIDES = {
  "Sliding Window": {
    summary: "Maintain a window of elements that satisfies a condition. Expand the right boundary to include more elements, shrink the left when a constraint is violated.",
    when: "Contiguous subarrays/substrings, find max/min window satisfying a condition",
    template: `int left = 0, result = 0;
Map<Character, Integer> window = new HashMap<>();

for (int right = 0; right < s.length(); right++) {
    // 1. Add s[right] to window
    window.merge(s.charAt(right), 1, Integer::sum);
    
    // 2. Shrink window while constraint violated
    while (/* window invalid */) {
        window.merge(s.charAt(left), -1, Integer::sum);
        if (window.get(s.charAt(left)) == 0)
            window.remove(s.charAt(left));
        left++;
    }
    
    // 3. Update result
    result = Math.max(result, right - left + 1);
}
return result;`,
    complexity: { time: "O(n)", space: "O(k) — k = window constraint" },
    steps: ["Initialize left pointer and result", "Expand right pointer each iteration", "Check if window violates constraint", "Shrink from left until valid", "Update result with current window size"],
  },
  "Two Pointers": {
    summary: "Use two index pointers moving toward each other or in the same direction to solve array/string problems in O(n) instead of O(n²).",
    when: "Sorted array pair problems, removing duplicates, partitioning",
    template: `int left = 0, right = nums.length - 1;

while (left < right) {
    int sum = nums[left] + nums[right];
    
    if (sum == target) {
        // Found answer
        return new int[]{left + 1, right + 1};
    } else if (sum < target) {
        left++;   // Need larger sum
    } else {
        right--;  // Need smaller sum
    }
}
return new int[]{-1, -1};`,
    complexity: { time: "O(n)", space: "O(1)" },
    steps: ["Place pointers at start and end (or both at start for fast/slow)", "Define the convergence condition", "Move the pointer that improves the answer", "Stop when pointers meet or cross"],
  },
  "Binary Search": {
    summary: "Eliminate half the search space each step. Works on sorted arrays or when you can define a monotonic predicate.",
    when: "Sorted array search, finding boundaries, minimising maximum, monotonic functions",
    template: `int left = 0, right = nums.length - 1;

while (left <= right) {
    int mid = left + (right - left) / 2; // Avoid overflow
    
    if (nums[mid] == target) {
        return mid;
    } else if (nums[mid] < target) {
        left = mid + 1;
    } else {
        right = mid - 1;
    }
}
return -1; // Not found`,
    complexity: { time: "O(log n)", space: "O(1)" },
    steps: ["Set left = 0, right = n-1", "Compute mid = left + (right-left)/2", "If target found, return mid", "If nums[mid] < target, search right half", "Else search left half"],
  },
  "DFS": {
    summary: "Explore as deep as possible along each branch before backtracking. Uses recursion (or explicit stack).",
    when: "Tree/graph traversal, path finding, connected components, cycle detection",
    template: `// Tree DFS
void dfs(TreeNode node, int depth) {
    if (node == null) return; // Base case
    
    // Pre-order: process here
    process(node.val);
    
    dfs(node.left, depth + 1);
    dfs(node.right, depth + 1);
    
    // Post-order: process here if needed
}

// Graph DFS
void dfs(int node, boolean[] visited) {
    visited[node] = true;
    for (int neighbor : graph[node]) {
        if (!visited[neighbor])
            dfs(neighbor, visited);
    }
}`,
    complexity: { time: "O(V+E) for graphs, O(n) for trees", space: "O(h) — h = height/depth of recursion" },
    steps: ["Define base case (null node or visited)", "Mark current as visited/processed", "Recurse on children/neighbors", "Backtrack: undo state if needed (for path problems)"],
  },
  "Dynamic Programming": {
    summary: "Break problem into overlapping subproblems, solve each once, store results. Either top-down (memoization) or bottom-up (tabulation).",
    when: "Optimization problems, counting paths/ways, sequence problems with overlapping subproblems",
    template: `// Bottom-up tabulation
int[] dp = new int[n + 1];
dp[0] = baseCase;  // Initialize base case

for (int i = 1; i <= n; i++) {
    for (int j = 0; j < i; j++) {
        // Recurrence relation
        dp[i] = Math.max(dp[i], dp[j] + something);
    }
}
return dp[n];

// Top-down memoization
Map<Integer, Integer> memo = new HashMap<>();
int solve(int n) {
    if (base case) return base_value;
    if (memo.containsKey(n)) return memo.get(n);
    int result = /* recurrence */;
    memo.put(n, result);
    return result;
}`,
    complexity: { time: "O(n²) or O(n×m) typically", space: "O(n) or O(n×m)" },
    steps: ["Define dp[i] meaning clearly", "Identify base cases", "Write recurrence relation", "Determine iteration order", "Optimise space if possible (rolling array)"],
  },
};

// Topic → Patterns mapping
const TOPICS = [
  { id:"Arrays", patterns:["Sliding Window","Two Pointers","Binary Search","Prefix Sum"] },
  { id:"Strings", patterns:["Sliding Window","Two Pointers","KMP","Hashing"] },
  { id:"Trees", patterns:["DFS","BFS","Tree DP","Morris Traversal"] },
  { id:"Graphs", patterns:["DFS","BFS","Dijkstra","Union Find","Topological Sort"] },
  { id:"Dynamic Programming", patterns:["Dynamic Programming","Divide & Conquer"] },
  { id:"Linked List", patterns:["Two Pointers","Reversal","Floyd Cycle","Merge"] },
  { id:"Stack & Queue", patterns:["Monotonic Stack","BFS","Two Stack","Deque"] },
  { id:"Heap", patterns:["Top-K Elements","Merge K Lists","Median Stream"] },
];

// Language boilerplate
const BOILERPLATE = {
  Java: `class Solution {\n    public int solve(int[] nums) {\n        // Write your solution here\n        \n        return 0;\n    }\n}`,
  Python: `class Solution:\n    def solve(self, nums: list[int]) -> int:\n        # Write your solution here\n        \n        return 0`,
  "C++": `class Solution {\npublic:\n    int solve(vector<int>& nums) {\n        // Write your solution here\n        \n        return 0;\n    }\n};`,
  JavaScript: `/**\n * @param {number[]} nums\n * @return {number}\n */\nvar solve = function(nums) {\n    // Write your solution here\n    \n    return 0;\n};`,
};

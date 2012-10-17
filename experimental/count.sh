# Counts the number of error (non-zero) entries in each quad file.
# Swaps : for a tab for easy pasting into a spreadsheet

grep -vc 0 $(find quad*) | sed 's/:/	/'
import sys
import os
import pandas as pd

def clean_excel(input_path, output_path):
    # Check file exists
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    # 1. Read Excel with pandas (engine auto-detected)
    df = pd.read_excel(input_path, header=None)

    # 2. Delete rows 1–13 (indexes 0–12)
    df = df.drop(index=range(0, 13), errors='ignore')

    # 3. Delete column A (first column)
    if df.shape[1] > 0:
        df = df.drop(df.columns[0], axis=1)

    # 4. Delete rows containing 'Department' (case-insensitive)
    mask_department = df.apply(
        lambda row: row.astype(str).str.contains('Department', case=False, na=False).any(),
        axis=1
    )
    df = df[~mask_department].reset_index(drop=True)

    # 5. Insert empty row before 'Employee Code' rows (skip first and skip if already empty)
    new_rows = []
    first_occurrence = True
    n_cols = df.shape[1]

    for idx in range(len(df)):
        row = df.iloc[idx]
        row_list = row.tolist()

        # Check if row contains 'Employee Code'
        has_emp_code = any('Employee Code' in str(x) for x in row_list)

        if has_emp_code:
            if first_occurrence:
                first_occurrence = False
            else:
                # Check previous row in new_rows
                if len(new_rows) > 0:
                    prev_row = new_rows[-1]
                    prev_empty = all(pd.isna(x) or str(x).strip() == '' for x in prev_row)
                else:
                    prev_empty = False

                if not prev_empty:
                    new_rows.append([pd.NA]*n_cols)

        # Append current row
        new_rows.append(row_list)

    # Create cleaned DataFrame
    df_clean = pd.DataFrame(new_rows, columns=df.columns)

    # Ensure output is .xlsx
    if not output_path.lower().endswith('.xlsx'):
        output_path = os.path.splitext(output_path)[0] + '.xlsx'

    # Save cleaned Excel
    df_clean.to_excel(output_path, index=False, header=False)

    # 🔹 No emoji to avoid UnicodeEncodeError on Windows console
    print(f"Cleaned file saved to: {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python clean_excel_redesigned.py <input.xls/xlsx> <output.xlsx>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    clean_excel(input_file, output_file)

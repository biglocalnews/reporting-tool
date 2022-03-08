export const catSort = (a: string, b: string) => {
    const defaultCats = ["Gender", "Ethnicity", "Disability"];
    if (defaultCats.includes(a)) {
        if (defaultCats.includes(b)) {
            if (defaultCats.indexOf(a) > defaultCats.indexOf(b)) {
                return 1;
            }
            return -1;
        }
        return -1;
    }

    return a.localeCompare(b);
}
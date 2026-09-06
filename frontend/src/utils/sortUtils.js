/**
 * Sorts an array of class objects or class wrapper objects in ascending natural order:
 * e.g., 5-A, 5-B, 6-A, 6-B, ..., 9-B, 10-A, 10-B, etc.
 */
export const sortClassesAsc = (classes) => {
  if (!Array.isArray(classes)) return classes;

  return [...classes].sort((a, b) => {
    // Handle direct Class doc, populated object, or wrapper { class: ... } / { classId: ... }
    const classA = a?.class || a?.classId || a;
    const classB = b?.class || b?.classId || b;

    const strA = String(classA?.className || classA?.name || '').trim();
    const strB = String(classB?.className || classB?.name || '').trim();

    // Extract numeric standard: "5" -> 5, "10" -> 10, "Class 5" -> 5
    const numA = parseInt(strA.replace(/\D/g, ''), 10);
    const numB = parseInt(strB.replace(/\D/g, ''), 10);

    const hasNumA = !isNaN(numA);
    const hasNumB = !isNaN(numB);

    if (hasNumA && hasNumB) {
      if (numA !== numB) {
        return numA - numB;
      }
    } else if (hasNumA) {
      return -1;
    } else if (hasNumB) {
      return 1;
    } else {
      const cmp = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
      if (cmp !== 0) return cmp;
    }

    // Sort by division (A, B, C, etc.)
    const divA = String(classA?.division || '').trim().toUpperCase();
    const divB = String(classB?.division || '').trim().toUpperCase();
    return divA.localeCompare(divB, undefined, { numeric: true, sensitivity: 'base' });
  });
};

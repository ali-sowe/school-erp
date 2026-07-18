export function getChangedFields(oldData, newData) {

    const changes = {
        oldValues: {},
        newValues: {}
    };


    Object.keys(newData).forEach((key) => {

        // Ignore database timestamps
        if (
            key === "created_at" ||
            key === "updated_at"
        ) {
            return;
        }


        if (oldData[key] !== newData[key]) {

            changes.oldValues[key] = oldData[key];

            changes.newValues[key] = newData[key];
        }

    });


    return changes;
}
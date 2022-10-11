

export const catchErr = (msg?: string) => {
    return {
        success: false,
        msg: msg || "BAD REQUEST ...",
    }
}

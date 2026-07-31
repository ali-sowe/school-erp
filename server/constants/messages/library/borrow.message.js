export const BORROW_MESSAGES = {
    BORROWED: 'Book issued successfully.',
    RETURNED: 'Book returned successfully.',
    FETCHED: 'Borrow record retrieved successfully.',
    FETCHED_ALL: 'Borrow records retrieved successfully.',

    NOT_FOUND: 'Borrow record not found.',
    BOOK_NOT_FOUND: 'The specified book does not exist.',
    BOOK_ARCHIVED: 'Cannot issue a copy of an archived book.',
    STUDENT_NOT_FOUND: 'The specified student does not exist.',
    STUDENT_ARCHIVED: 'Cannot issue a book to an archived student.',
    COPY_NOT_FOUND: 'The specified copy does not exist.',
    COPY_NOT_AVAILABLE: 'This copy is not available to borrow.',
    NO_COPIES_AVAILABLE: 'No available copies of this book to issue.',
    ALREADY_BORROWING_THIS_BOOK: 'This student already has an unreturned copy of this book.',

    DUE_DATE_BEFORE_BORROWED_DATE: 'The due date must be on or after the borrowed date.',
    ALREADY_RETURNED: 'This book has already been returned.',
    INVALID_DATE_RANGE: 'The "from" date must be on or before the "to" date.'
};

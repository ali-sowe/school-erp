import Joi from 'joi';

export const createCalendarEventSchema = Joi.object({
    academic_year_id: Joi.number().integer().positive().required(),
    title: Joi.string().trim().max(150).required(),
    description: Joi.string().trim().max(1000).allow('', null),
    // Free text, not a fixed enum — schools name their own categories
    // (e.g. "Public Holiday", "Mid-Term Break", "Eid", "Sports Day",
    // "Emergency Closure"). is_school_closed is what actually drives
    // behavior, never this field.
    category: Joi.string().trim().max(50).allow('', null),
    start_date: Joi.date().iso().required(),
    end_date: Joi.date().iso().required(),
    is_school_closed: Joi.boolean().default(false)
});

export const updateCalendarEventSchema = Joi.object({
    title: Joi.string().trim().max(150),
    description: Joi.string().trim().max(1000).allow('', null),
    category: Joi.string().trim().max(50).allow('', null),
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso(),
    is_school_closed: Joi.boolean()
}).min(1);

export const copyEventsToYearSchema = Joi.object({
    source_academic_year_id: Joi.number().integer().positive().required(),
    target_academic_year_id: Joi.number().integer().positive().required()
});

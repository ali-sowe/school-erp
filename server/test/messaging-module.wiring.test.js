import test from 'node:test';
import assert from 'node:assert/strict';
import * as conversationService from '../services/messaging/conversation.service.js';
import * as announcementService from '../services/messaging/announcement.service.js';

const serviceFunctionsToCheck = [
    [conversationService, 'createConversation', [{ participant_ids: [2] }, 1, 1]],
    [conversationService, 'getConversationsForUser', [1, 1]],
    [conversationService, 'getConversationById', [1, 1, 1]],
    [conversationService, 'getMessages', [1, 1, 1, {}]],
    [conversationService, 'sendMessage', [1, 1, 1, 'Hello']],
    [conversationService, 'deleteMessage', [1, 1, 1, 1]],
    [conversationService, 'markConversationAsRead', [1, 1, 1]],
    [announcementService, 'createAnnouncement', [{ title: 'Test', body: 'Test body', audience_type: 'SCHOOL' }, 1, 1]],
    [announcementService, 'getAnnouncements', [1]],
    [announcementService, 'getAnnouncementById', [1, 1]],
    [announcementService, 'updateAnnouncement', [1, { title: 'Updated' }, 1, 1]],
    [announcementService, 'archiveAnnouncement', [1, 1, 1]],
    [announcementService, 'restoreAnnouncement', [1, 1, 1]],
    [announcementService, 'markAsRead', [1, 1, 1]],
    [announcementService, 'getReaders', [1, 1]],
    [announcementService, 'getRecipients', [1, 1]]
];

test('messaging module services export the expected functions', () => {
    for (const [serviceModule, functionName] of serviceFunctionsToCheck) {
        assert.equal(typeof serviceModule[functionName], 'function', `${functionName} should be an exported function`);
    }
});

// A missing DB connection (ECONNREFUSED) is expected in environments without
// MySQL running and is not what this test is checking for. A ReferenceError
// means a broken/missing import — that's the real bug class this guards
// against (see: exam-module.wiring.test.js, finance-module.wiring.test.js).
test('messaging module services do not throw a ReferenceError (imports are wired correctly)', async () => {
    for (const [serviceModule, functionName, args] of serviceFunctionsToCheck) {
        try {
            await serviceModule[functionName](...args);
        } catch (error) {
            assert.notEqual(
                error.constructor.name,
                'ReferenceError',
                `${functionName} threw a ReferenceError, likely a missing import: ${error.message}`
            );
        }
    }
});

test('realtime helper functions are no-ops when no socket server is initialized', async () => {
    const { emitToUser, emitToUsers, emitToSchool, emitToRoom } = await import('../helpers/realtime/realtime.helper.js');

    assert.doesNotThrow(() => emitToRoom('room:1', 'event', {}));
    assert.doesNotThrow(() => emitToUser(1, 'event', {}));
    assert.doesNotThrow(() => emitToUsers([1, 2], 'event', {}));
    assert.doesNotThrow(() => emitToSchool(1, 'event', {}));
});

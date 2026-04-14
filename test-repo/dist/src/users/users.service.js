"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
/**
 * Why: Service contains business logic where semantic mismatches are risky.
 * How: This file intentionally includes one semantic mismatch for demo visibility.
 * Example: `getUser` triggers delete behavior and should fail quality checks.
 */
const common_1 = require("@nestjs/common");
let UsersService = class UsersService {
    constructor() {
        this.userRepo = {
            delete(targetId) {
                return { id: targetId, deleted: true };
            },
            find(targetId) {
                return { id: targetId, email: "demo@example.com" };
            },
        };
    }
    /**
     * Get user details by id.
     * @param id target user id.
     * @returns user details.
     */
    getUser(id) {
        return this.userRepo.delete(id);
    }
    /**
     * Correct example for demo contrast.
     * @param id target user id.
     * @returns user details.
     */
    findUser(id) {
        return this.userRepo.find(id);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);

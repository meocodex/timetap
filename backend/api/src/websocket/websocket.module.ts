// src/websocket/websocket.module.ts

import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
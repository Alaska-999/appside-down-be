import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// 'jwt' має збігатися з назвою стратегії, яку ми вказали вище
export class JwtAuthGuard extends AuthGuard('jwt') { }
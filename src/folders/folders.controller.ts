import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) { }

  @Post()
  create(@Body() createFolderDto: CreateFolderDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.foldersService.create(userId, createFolderDto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.foldersService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.foldersService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFolderDto: UpdateFolderDto, @Req() req: any) {
    return this.foldersService.update(req.user.userId, id, updateFolderDto);
  }

  @Patch(':id/modules')
  addModulesToFolder(
    @Param('id') folderId: string,
    @Body() body: { moduleIds: string[] },
    @Req() req: any
  ) {
    const userId = req.user.userId;
    return this.foldersService.addModules(userId, folderId, body.moduleIds);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.foldersService.remove(req.user.userId, id);
  }
}

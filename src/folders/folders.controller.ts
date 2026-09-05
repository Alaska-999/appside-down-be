import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, Query } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { ModuleIdsDto } from './dto/module-ids.dto';
import { ModuleTagIdsDto, TagNameDto } from './dto/tag.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { parseCursorQuery } from 'src/common/pagination/pagination.util';

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
  findAll(
    @Query() query: { cursor?: string; limit?: string; search?: string },
    @Req() req: any,
  ) {
    return this.foldersService.findAll(req.user.userId, parseCursorQuery(query));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.foldersService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFolderDto: UpdateFolderDto, @Req() req: any) {
    return this.foldersService.update(req.user.userId, id, updateFolderDto);
  }

  @Patch(':id/modules/remove')
  removeModulesFromFolder(
    @Param('id') folderId: string,
    @Body() body: ModuleIdsDto,
    @Req() req: any
  ) {
    const userId = req.user.userId;
    return this.foldersService.removeModules(userId, folderId, body.moduleIds);
  }

  @Patch(':id/modules')
  addModulesToFolder(
    @Param('id') folderId: string,
    @Body() body: ModuleIdsDto,
    @Req() req: any
  ) {
    const userId = req.user.userId;
    return this.foldersService.addModules(userId, folderId, body.moduleIds);
  }

  @Post(':id/tags')
  createTag(@Param('id') folderId: string, @Body() body: TagNameDto, @Req() req: any) {
    return this.foldersService.createTag(req.user.userId, folderId, body.name);
  }

  @Patch(':id/tags/:tagId')
  renameTag(
    @Param('id') folderId: string,
    @Param('tagId') tagId: string,
    @Body() body: TagNameDto,
    @Req() req: any,
  ) {
    return this.foldersService.renameTag(req.user.userId, folderId, tagId, body.name);
  }

  @Delete(':id/tags/:tagId')
  deleteTag(@Param('id') folderId: string, @Param('tagId') tagId: string, @Req() req: any) {
    return this.foldersService.deleteTag(req.user.userId, folderId, tagId);
  }

  @Patch(':id/modules/:moduleId/tags')
  setModuleTags(
    @Param('id') folderId: string,
    @Param('moduleId') moduleId: string,
    @Body() body: ModuleTagIdsDto,
    @Req() req: any,
  ) {
    return this.foldersService.setModuleTags(req.user.userId, folderId, moduleId, body.tagIds);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.foldersService.remove(req.user.userId, id);
  }
}
